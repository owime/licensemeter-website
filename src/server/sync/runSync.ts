import { and, eq, inArray, lt, notInArray, sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  adobeConnections,
  adobeUsers as adobeUsersTable,
  findings,
  priceBook,
  snapshots,
  syncRuns,
  tenantSkus,
  tenants,
  tenantUsers,
} from "~/server/db/schema";
import { DemoAdobeClient, UmapiClient } from "~/server/adobe/client";
import { adobePriceKey, analyzeAdobeWaste } from "~/server/adobe/analyze";
import { decryptSecret } from "~/server/crypto";
import type { AdobeUser } from "~/server/types";
import { DemoGraphClient } from "~/server/graph/demoGraph";
import { MsGraphClient } from "~/server/graph/msGraph";
import { skuDefaultPriceCents, skuDisplayName } from "~/server/graph/skuCatalog";
import {
  PremiumLicenseRequiredError,
  type CopilotUsageRow,
  type GraphClient,
  type GraphSubscribedSku,
  type GraphUser,
  type UsageReportRow,
} from "~/server/graph/types";
import { notifyOps } from "~/server/ops";
import { joinSignals } from "~/server/sync/join";
import type { SyncRunStatus, SyncStep } from "~/server/types";
import { analyzeWaste, type WasteFinding } from "~/server/waste/engine";

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Error text persisted to sync_runs (and therefore visible to workspace
 * members): length-bounded, no stack traces. Full errors go to server logs.
 */
const errText = (err: unknown): string => {
  console.error("[sync]", err);
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, 300);
};

export type SyncResult = {
  runId: string;
  status: SyncRunStatus;
  steps: SyncStep[];
};

/**
 * Full sync for one tenant: pull Graph data, persist the snapshot, run the
 * waste analysis, diff findings, and record a per-step run log. Non-critical
 * steps degrade to warnings; the sync continues with what it has.
 */
export const runSync = async (tenantId: string): Promise<SyncResult> => {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  if (!tenant) throw new Error(`Unknown tenant ${tenantId}`);

  const client: GraphClient = tenant.isDemo
    ? new DemoGraphClient()
    : new MsGraphClient(tenant.tid);

  // Fail runs stuck in "running" (crashed process) so the lock cannot deadlock.
  await db
    .update(syncRuns)
    .set({ status: "failed", error: "stale run", finishedAt: new Date() })
    .where(
      and(
        eq(syncRuns.tenantId, tenantId),
        eq(syncRuns.status, "running"),
        lt(syncRuns.startedAt, new Date(Date.now() - 15 * 60 * 1000)),
      ),
    );

  // Concurrency lock via the partial unique index: only one running sync per
  // tenant. A concurrent caller gets the in-flight run back instead of racing.
  let runId: string;
  try {
    const [run] = await db
      .insert(syncRuns)
      .values({ tenantId, status: "running" })
      .returning({ id: syncRuns.id });
    runId = run!.id;
  } catch {
    const inFlight = await db.query.syncRuns.findFirst({
      where: and(eq(syncRuns.tenantId, tenantId), eq(syncRuns.status, "running")),
    });
    return { runId: inFlight?.id ?? "", status: "running", steps: [] };
  }

  const steps: SyncStep[] = [];
  const now = new Date();

  try {
    // --- Pull phase -----------------------------------------------------
    const orgName = await client.getOrganizationName();

    let skus: GraphSubscribedSku[] = [];
    try {
      skus = await client.getSubscribedSkus();
      steps.push({ step: "subscribedSkus", status: "ok", count: skus.length });
    } catch (err) {
      steps.push({
        step: "subscribedSkus",
        status: "failed",
        message: errText(err),
      });
      throw err; // critical: nothing useful without SKUs
    }

    let concealmentSetting: boolean | null = null;
    try {
      concealmentSetting = await client.getReportConcealment();
      steps.push({
        step: "reportSettings",
        status: concealmentSetting === null ? "warning" : "ok",
        message:
          concealmentSetting === null
            ? "Could not read /admin/reportSettings"
            : `displayConcealedNames=${concealmentSetting}`,
      });
    } catch {
      steps.push({ step: "reportSettings", status: "warning" });
    }

    let graphUsers: GraphUser[] = [];
    let hasP1 = true;
    try {
      try {
        graphUsers = await client.listUsers({ includeSignInActivity: true });
        steps.push({ step: "signInActivity", status: "ok" });
      } catch (err) {
        if (err instanceof PremiumLicenseRequiredError) {
          hasP1 = false;
          steps.push({
            step: "signInActivity",
            status: "skipped",
            message:
              "Tenant has no Entra ID P1/P2; falling back to usage reports",
          });
          graphUsers = await client.listUsers({ includeSignInActivity: false });
        } else {
          throw err;
        }
      }
      steps.push({ step: "users", status: "ok", count: graphUsers.length });
    } catch (err) {
      steps.push({
        step: "users",
        status: "failed",
        message: errText(err),
      });
      throw err; // critical
    }

    let usageRows: UsageReportRow[] = [];
    try {
      usageRows = await client.getActiveUserDetail("D90");
      steps.push({ step: "usageReports", status: "ok", count: usageRows.length });
    } catch (err) {
      steps.push({
        step: "usageReports",
        status: "warning",
        message: errText(err),
      });
    }

    let copilotRows: CopilotUsageRow[] = [];
    try {
      copilotRows = await client.getCopilotUsage("D90");
      steps.push({ step: "copilotUsage", status: "ok", count: copilotRows.length });
    } catch (err) {
      steps.push({
        step: "copilotUsage",
        status: "warning",
        message: errText(err),
      });
    }

    // --- Adobe (beta): entitlements for offboarding-leak detection ---------
    let adobeRows: AdobeUser[] = [];
    let adobeActive = false;
    const adobeConn = await db.query.adobeConnections.findFirst({
      where: eq(adobeConnections.tenantId, tenantId),
    });
    if (tenant.isDemo || adobeConn) {
      adobeActive = true;
      try {
        const adobeClient = tenant.isDemo
          ? new DemoAdobeClient()
          : new UmapiClient({
              orgId: adobeConn!.orgId,
              clientId: adobeConn!.clientId,
              clientSecret: decryptSecret(adobeConn!.clientSecretEnc),
            });
        adobeRows = await adobeClient.getUsers();
        steps.push({ step: "adobeUsers", status: "ok", count: adobeRows.length });
        if (adobeConn) {
          await db
            .update(adobeConnections)
            .set({ lastSyncAt: now, lastSyncStatus: "ok" })
            .where(eq(adobeConnections.tenantId, tenantId));
        }
      } catch (err) {
        adobeActive = false;
        steps.push({ step: "adobeUsers", status: "warning", message: errText(err) });
        if (adobeConn) {
          await db
            .update(adobeConnections)
            .set({ lastSyncAt: now, lastSyncStatus: "failed" })
            .where(eq(adobeConnections.tenantId, tenantId));
        }
      }
    }

    // --- Join + analyze ---------------------------------------------------
    const joined = joinSignals({ graphUsers, usageRows, copilotRows, hasP1 });

    // --- Persist phase (upsert + prune; no destructive window) -------------
    if (skus.length > 0) {
      await db
        .insert(tenantSkus)
        .values(
          skus.map((s) => ({
            tenantId,
            skuId: s.skuId,
            skuPartNumber: s.skuPartNumber,
            displayName: skuDisplayName(s.skuId, s.skuPartNumber),
            prepaidEnabled: s.prepaidUnits.enabled,
            prepaidSuspended: s.prepaidUnits.suspended,
            prepaidWarning: s.prepaidUnits.warning,
            consumedUnits: s.consumedUnits,
            updatedAt: now,
          })),
        )
        .onConflictDoUpdate({
          target: [tenantSkus.tenantId, tenantSkus.skuId],
          set: {
            skuPartNumber: sql`excluded.sku_part_number`,
            displayName: sql`excluded.display_name`,
            prepaidEnabled: sql`excluded.prepaid_enabled`,
            prepaidSuspended: sql`excluded.prepaid_suspended`,
            prepaidWarning: sql`excluded.prepaid_warning`,
            consumedUnits: sql`excluded.consumed_units`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }
    // Prune only when Graph returned data; an empty result keeps the last
    // known inventory instead of wiping it (defensive against odd responses).
    if (skus.length > 0) {
      await db
        .delete(tenantSkus)
        .where(
          and(
            eq(tenantSkus.tenantId, tenantId),
            notInArray(tenantSkus.skuId, skus.map((s) => s.skuId)),
          ),
        );
    }

    for (const batch of chunk(joined.users, 250)) {
      await db
        .insert(tenantUsers)
        .values(
          batch.map((u) => ({
            tenantId,
            graphId: u.graphId,
            upn: u.upn,
            displayName: u.displayName,
            accountEnabled: u.accountEnabled,
            userType: u.userType,
            createdDateTime: u.createdDateTime,
            lastInteractiveSignIn: u.lastInteractiveSignIn,
            lastNonInteractiveSignIn: u.lastNonInteractiveSignIn,
            lastActivity: u.lastActivity,
            workloadActivity: u.workloadActivity,
            licenses: u.licenses,
            syncedAt: now,
          })),
        )
        .onConflictDoUpdate({
          target: [tenantUsers.tenantId, tenantUsers.graphId],
          set: {
            upn: sql`excluded.upn`,
            displayName: sql`excluded.display_name`,
            accountEnabled: sql`excluded.account_enabled`,
            userType: sql`excluded.user_type`,
            createdDateTime: sql`excluded.created_date_time`,
            lastInteractiveSignIn: sql`excluded.last_interactive_sign_in`,
            lastNonInteractiveSignIn: sql`excluded.last_non_interactive_sign_in`,
            lastActivity: sql`excluded.last_activity`,
            workloadActivity: sql`excluded.workload_activity`,
            licenses: sql`excluded.licenses`,
            syncedAt: sql`excluded.synced_at`,
          },
        });
    }
    if (joined.users.length > 0) {
      await db
        .delete(tenantUsers)
        .where(
          and(
            eq(tenantUsers.tenantId, tenantId),
            notInArray(
              tenantUsers.graphId,
              joined.users.map((u) => u.graphId),
            ),
          ),
        );
    }

    // Persist Adobe users (upsert + prune) when the connector is active.
    if (adobeActive) {
      if (adobeRows.length > 0) {
        await db
          .insert(adobeUsersTable)
          .values(
            adobeRows.map((u) => ({
              tenantId,
              email: u.email.toLowerCase(),
              status: u.status,
              products: u.products,
              syncedAt: now,
            })),
          )
          .onConflictDoUpdate({
            target: [adobeUsersTable.tenantId, adobeUsersTable.email],
            set: {
              status: sql`excluded.status`,
              products: sql`excluded.products`,
              syncedAt: sql`excluded.synced_at`,
            },
          });
        await db
          .delete(adobeUsersTable)
          .where(
            and(
              eq(adobeUsersTable.tenantId, tenantId),
              notInArray(
                adobeUsersTable.email,
                adobeRows.map((u) => u.email.toLowerCase()),
              ),
            ),
          );
      } else {
        await db
          .delete(adobeUsersTable)
          .where(eq(adobeUsersTable.tenantId, tenantId));
      }
    }

    // Prefill missing price book rows from the static catalog.
    const existingPrices = await db.query.priceBook.findMany({
      where: eq(priceBook.tenantId, tenantId),
    });
    const known = new Set(existingPrices.map((p) => p.skuId));
    const missing = skus.filter((s) => !known.has(s.skuId));
    if (missing.length > 0) {
      await db.insert(priceBook).values(
        missing.map((s) => ({
          tenantId,
          skuId: s.skuId,
          monthlyPriceCents: skuDefaultPriceCents(s.skuId),
          source: "default" as const,
        })),
      );
    }

    // Prefill Adobe product prices (demo gets plausible list estimates).
    const DEMO_ADOBE_PRICES: Record<string, number> = {
      "Creative Cloud All Apps": 7100,
      "Acrobat Pro": 2000,
      Photoshop: 2400,
    };
    const adobeProducts = [...new Set(adobeRows.flatMap((u) => u.products))];
    const missingAdobe = adobeProducts
      .map(adobePriceKey)
      .filter((id) => !known.has(id));
    if (missingAdobe.length > 0) {
      await db
        .insert(priceBook)
        .values(
          missingAdobe.map((id) => ({
            tenantId,
            skuId: id,
            monthlyPriceCents: tenant.isDemo
              ? (DEMO_ADOBE_PRICES[id.slice("adobe:".length)] ?? 0)
              : 0,
            source: "default" as const,
          })),
        )
        .onConflictDoNothing();
    }
    const prices = Object.fromEntries(
      (
        await db.query.priceBook.findMany({
          where: eq(priceBook.tenantId, tenantId),
        })
      ).map((p) => [p.skuId, p.monthlyPriceCents]),
    );

    const newFindings = analyzeWaste({
      users: joined.users,
      skus: skus.map((s) => ({
        skuId: s.skuId,
        skuPartNumber: s.skuPartNumber,
        prepaidEnabled: s.prepaidUnits.enabled,
        consumedUnits: s.consumedUnits,
      })),
      prices,
      now,
      activitySignal: joined.activitySignal,
      copilotSignal: joined.copilotSignal,
      usageAggregate: joined.usageAggregate,
      copilotAggregate: joined.copilotAggregate,
      inactiveDays: tenant.inactiveDays,
    });
    const adobeFindings = analyzeAdobeWaste(
      adobeRows,
      joined.users.map((u) => ({
        upn: u.upn,
        displayName: u.displayName,
        accountEnabled: u.accountEnabled,
      })),
      prices,
    );
    const allFindings = newFindings.concat(adobeFindings);
    steps.push({ step: "wasteAnalysis", status: "ok", count: allFindings.length });

    await diffFindings(tenantId, allFindings, now);

    // --- Snapshot + tenant capabilities ------------------------------------
    const totalMonthlySpendCents = skus.reduce(
      (sum, s) => sum + s.consumedUnits * (prices[s.skuId] ?? 0),
      0,
    );
    const openRows = await db.query.findings.findMany({
      where: and(
        eq(findings.tenantId, tenantId),
        inArray(findings.status, ["open", "acknowledged"]),
      ),
    });
    const totalMonthlyWasteCents = openRows.reduce(
      (sum, f) => sum + f.monthlyImpactCents,
      0,
    );

    const day = now.toISOString().slice(0, 10);
    await db
      .insert(snapshots)
      .values({
        tenantId,
        day,
        totalMonthlySpendCents,
        totalMonthlyWasteCents,
        purchasedSeats: skus.reduce((s, x) => s + x.prepaidUnits.enabled, 0),
        assignedSeats: skus.reduce((s, x) => s + x.consumedUnits, 0),
        bySku: Object.fromEntries(
          skus.map((s) => [
            s.skuId,
            { purchased: s.prepaidUnits.enabled, assigned: s.consumedUnits },
          ]),
        ),
      })
      .onConflictDoUpdate({
        target: [snapshots.tenantId, snapshots.day],
        set: {
          totalMonthlySpendCents,
          totalMonthlyWasteCents,
          purchasedSeats: skus.reduce((s, x) => s + x.prepaidUnits.enabled, 0),
          assignedSeats: skus.reduce((s, x) => s + x.consumedUnits, 0),
        },
      });

    await db
      .update(tenants)
      .set({
        hasP1,
        concealedNames: concealmentSetting ?? joined.concealed,
        activitySignal: joined.activitySignal,
        copilotSignal: joined.copilotSignal,
        usageAggregate: joined.usageAggregate ?? null,
        copilotAggregate: joined.copilotAggregate ?? null,
        ...(orgName && !tenant.isDemo ? { name: orgName } : {}),
      })
      .where(eq(tenants.id, tenantId));

    const status: SyncRunStatus = steps.some((s) => s.status === "failed")
      ? "partial"
      : "success";
    await db
      .update(syncRuns)
      .set({ status, steps, finishedAt: new Date() })
      .where(eq(syncRuns.id, runId));
    return { runId, status, steps };
  } catch (err) {
    const message = errText(err);
    await db
      .update(syncRuns)
      .set({
        status: "failed",
        steps,
        error: message,
        finishedAt: new Date(),
      })
      .where(eq(syncRuns.id, runId));
    void notifyOps(
      `sync FAILED for tenant ${tenant.name ?? tenant.tid}: ${message}`,
    );
    return { runId, status: "failed", steps };
  }
};

/**
 * Re-runs the waste analysis from data already in the database — used after
 * price book edits so impact figures update without a Graph round trip.
 * Falls back gracefully when the tenant has never synced.
 */
export const runAnalysis = async (tenantId: string): Promise<void> => {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  if (!tenant) throw new Error(`Unknown tenant ${tenantId}`);

  const [skuRows, userRows, priceRows, adobeRows] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, tenantId) }),
    db.query.tenantUsers.findMany({ where: eq(tenantUsers.tenantId, tenantId) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, tenantId) }),
    db.query.adobeUsers.findMany({
      where: eq(adobeUsersTable.tenantId, tenantId),
    }),
  ]);
  if (skuRows.length === 0 && userRows.length === 0) return;

  const now = new Date();
  const prices = Object.fromEntries(
    priceRows.map((p) => [p.skuId, p.monthlyPriceCents]),
  );

  const newFindings = analyzeWaste({
    users: userRows.map((r) => ({
      graphId: r.graphId,
      upn: r.upn,
      displayName: r.displayName,
      accountEnabled: r.accountEnabled,
      userType: r.userType,
      createdDateTime: r.createdDateTime,
      lastActivity: r.lastActivity,
      copilotLastActivity: r.workloadActivity?.copilot
        ? new Date(r.workloadActivity.copilot)
        : null,
      licenses: r.licenses,
    })),
    skus: skuRows.map((s) => ({
      skuId: s.skuId,
      skuPartNumber: s.skuPartNumber,
      prepaidEnabled: s.prepaidEnabled,
      consumedUnits: s.consumedUnits,
    })),
    prices,
    now,
    // Prefer the signal recorded by the last sync; the boolean derivation is
    // only a fallback for tenants synced before the column existed. Unknown
    // concealment (null) is treated as concealed — conservative, no false
    // per-user inactivity findings.
    activitySignal:
      tenant.activitySignal ??
      (tenant.hasP1 || tenant.concealedNames === false ? "full" : "none"),
    copilotSignal: tenant.copilotSignal ?? "none",
    usageAggregate: tenant.usageAggregate ?? undefined,
    copilotAggregate: tenant.copilotAggregate ?? undefined,
    inactiveDays: tenant.inactiveDays,
  });

  const adobeFindings = analyzeAdobeWaste(
    adobeRows.map((r) => ({
      email: r.email,
      status: r.status,
      products: r.products,
    })),
    userRows.map((r) => ({
      upn: r.upn,
      displayName: r.displayName,
      accountEnabled: r.accountEnabled,
    })),
    prices,
  );

  await diffFindings(tenantId, newFindings.concat(adobeFindings), now);

  const totalMonthlySpendCents = skuRows.reduce(
    (sum, s) => sum + s.consumedUnits * (prices[s.skuId] ?? 0),
    0,
  );
  const openRows = await db.query.findings.findMany({
    where: and(
      eq(findings.tenantId, tenantId),
      inArray(findings.status, ["open", "acknowledged"]),
    ),
  });
  const totalMonthlyWasteCents = openRows.reduce(
    (sum, f) => sum + f.monthlyImpactCents,
    0,
  );
  const day = now.toISOString().slice(0, 10);
  await db
    .insert(snapshots)
    .values({
      tenantId,
      day,
      totalMonthlySpendCents,
      totalMonthlyWasteCents,
      purchasedSeats: skuRows.reduce((s, x) => s + x.prepaidEnabled, 0),
      assignedSeats: skuRows.reduce((s, x) => s + x.consumedUnits, 0),
      bySku: Object.fromEntries(
        skuRows.map((s) => [
          s.skuId,
          { purchased: s.prepaidEnabled, assigned: s.consumedUnits },
        ]),
      ),
    })
    .onConflictDoUpdate({
      target: [snapshots.tenantId, snapshots.day],
      set: { totalMonthlySpendCents, totalMonthlyWasteCents },
    });
};

/**
 * Reconciles the new analysis with stored findings:
 * new keys are inserted as open, reappearing resolved findings reopen,
 * acknowledged findings stay acknowledged, vanished findings auto-resolve.
 */
const diffFindings = async (
  tenantId: string,
  newFindings: WasteFinding[],
  now: Date,
) => {
  const existing = await db.query.findings.findMany({
    where: eq(findings.tenantId, tenantId),
  });
  const existingByKey = new Map(existing.map((f) => [f.dedupeKey, f]));
  const newByKey = new Map(newFindings.map((f) => [f.dedupeKey, f]));

  const toInsert = newFindings.filter((f) => !existingByKey.has(f.dedupeKey));
  if (toInsert.length > 0) {
    await db.insert(findings).values(
      toInsert.map((f) => ({
        tenantId,
        dedupeKey: f.dedupeKey,
        rule: f.rule,
        graphUserId: f.graphUserId,
        skuId: f.skuId,
        title: f.title,
        detail: f.detail,
        monthlyImpactCents: f.monthlyImpactCents,
        status: "open" as const,
        firstSeenAt: now,
        lastSeenAt: now,
      })),
    );
  }

  for (const f of existing) {
    const fresh = newByKey.get(f.dedupeKey);
    if (fresh) {
      await db
        .update(findings)
        .set({
          title: fresh.title,
          detail: fresh.detail,
          monthlyImpactCents: fresh.monthlyImpactCents,
          lastSeenAt: now,
          ...(f.status === "resolved"
            ? { status: "open" as const, resolvedAt: null }
            : {}),
        })
        .where(eq(findings.id, f.id));
    } else if (f.status !== "resolved") {
      await db
        .update(findings)
        .set({ status: "resolved", resolvedAt: now })
        .where(eq(findings.id, f.id));
    }
  }
};
