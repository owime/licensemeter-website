import { and, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { env, siteUrl } from "~/env";
import { fmtMoney } from "~/lib/format";
import { db } from "~/server/db";
import {
  findings,
  memberships,
  snapshots,
  syncRuns,
  tenants,
} from "~/server/db/schema";
import {
  computeDigestDelta,
  daysUntilRenewal,
  DELTA_WINDOW_MS,
  renewalPhrase,
} from "~/server/digestDelta";
import {
  allClearHtml,
  digestHtml,
  emailEnabled,
  sendEmail,
} from "~/server/email";
import { notifyOps } from "~/server/ops";

export const maxDuration = 300;

/** Only syncs this fresh keep a zero-findings tenant in the all-clear loop. */
const RECENT_SYNC_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * Weekly digest to workspace owners/admins. No-op until Resend is configured.
 * Leads with the 7-day delta; tenants with zero open findings get a short
 * all-clear instead of silence (silence right after everything is fixed reads
 * like the product stopped working — a churn signal).
 */
export const GET = async (req: NextRequest) => {
  if (
    !env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) {
    return NextResponse.json({ skipped: "email not configured" });
  }

  const allTenants = await db.query.tenants.findMany({
    where: eq(tenants.isDemo, false),
  });
  const now = new Date();
  let sent = 0;

  for (const tenant of allTenants) {
    try {
      const [admins, open, resolvedRecent, latest] = await Promise.all([
        db.query.memberships.findMany({
          where: and(
            eq(memberships.tenantId, tenant.id),
            inArray(memberships.role, ["owner", "admin"]),
            isNotNull(memberships.oid),
          ),
        }),
        db.query.findings.findMany({
          where: and(
            eq(findings.tenantId, tenant.id),
            inArray(findings.status, ["open", "acknowledged"]),
          ),
          orderBy: desc(findings.monthlyImpactCents),
        }),
        db.query.findings.findMany({
          where: and(
            eq(findings.tenantId, tenant.id),
            // status filter keeps this disjoint from the open/acknowledged
            // query above — a reopened finding can carry a stale resolvedAt.
            eq(findings.status, "resolved"),
            isNotNull(findings.resolvedAt),
            gte(findings.resolvedAt, new Date(now.getTime() - DELTA_WINDOW_MS)),
          ),
        }),
        db.query.snapshots.findFirst({
          where: eq(snapshots.tenantId, tenant.id),
          orderBy: desc(snapshots.day),
        }),
      ]);

      const to = admins.map((m) => m.email).filter(Boolean);
      if (to.length === 0) continue;

      const delta = computeDigestDelta([...open, ...resolvedRecent], now);
      const renewalDays = daysUntilRenewal(tenant.renewalDate, now);
      const tenantLabel = tenant.name ?? "your tenant";
      const tenantName = tenant.name ?? tenant.tid;

      if (open.length === 0) {
        // All clear — but only for tenants that actually synced recently.
        // A stale tenant with no data would get a hollow "all clear" forever.
        const recentSync = await db.query.syncRuns.findFirst({
          where: and(
            eq(syncRuns.tenantId, tenant.id),
            // "partial" counts: connector hiccups still leave the M365 data
            // fresh, and a flaky connector must not mute the all-clear forever.
            inArray(syncRuns.status, ["success", "partial"]),
            isNotNull(syncRuns.finishedAt),
            gte(syncRuns.finishedAt, new Date(now.getTime() - RECENT_SYNC_MS)),
          ),
        });
        if (!recentSync) continue;

        await sendEmail({
          to,
          subject: `LicenseMeter: all clear in ${tenantLabel}`,
          html: allClearHtml({
            tenantName,
            resolvedCount: delta.resolvedCount,
            resolvedImpact: fmtMoney(delta.resolvedCents, tenant.currency),
            renewalLine:
              renewalDays === null
                ? undefined
                : `${renewalPhrase(renewalDays)} — you go in clean.`,
            appUrl: siteUrl(),
          }),
        });
        sent++;
        continue;
      }

      const wasteCents = latest?.totalMonthlyWasteCents ?? 0;
      const openCents = open.reduce((s, f) => s + f.monthlyImpactCents, 0);
      // New findings lead the subject; otherwise fall back to the standing
      // totals. With unpriced SKUs the waste is 0 — lead with the findings
      // count instead of an underwhelming zero.
      const subject =
        delta.newCount > 0
          ? `LicenseMeter: ${delta.newCount} new finding${delta.newCount === 1 ? "" : "s"}, +${fmtMoney(delta.newCents, tenant.currency)}/mo in ${tenantLabel}`
          : wasteCents > 0
            ? `LicenseMeter: ${fmtMoney(wasteCents, tenant.currency)}/mo wasted in ${tenantLabel}`
            : `LicenseMeter: ${open.length} open findings in ${tenantLabel}`;

      await sendEmail({
        to,
        subject,
        html: digestHtml({
          tenantName,
          currency: tenant.currency,
          monthlySpend: fmtMoney(latest?.totalMonthlySpendCents ?? 0, tenant.currency),
          monthlyWaste: fmtMoney(latest?.totalMonthlyWasteCents ?? 0, tenant.currency),
          openFindings: open.length,
          topFindings: open.slice(0, 5).map((f) => ({
            title: f.title,
            impact: fmtMoney(f.monthlyImpactCents, tenant.currency),
          })),
          delta: {
            newCount: delta.newCount,
            newImpact: fmtMoney(delta.newCents, tenant.currency),
            resolvedCount: delta.resolvedCount,
            resolvedImpact: fmtMoney(delta.resolvedCents, tenant.currency),
          },
          renewalLine:
            renewalDays === null
              ? undefined
              : `${renewalPhrase(renewalDays)} — ${open.length} open finding${open.length === 1 ? "" : "s"} worth ${fmtMoney(openCents, tenant.currency)}/mo to reclaim before you re-commit.`,
          appUrl: siteUrl(),
        }),
      });
      sent++;
    } catch (err) {
      void notifyOps(
        `digest failed for tenant ${tenant.name ?? tenant.tid}: ${err instanceof Error ? err.message : String(err)}`,
        { key: `digest:${tenant.id}`, cooldownMs: 60 * 60 * 1000 },
      );
    }
  }

  return NextResponse.json({ tenants: allTenants.length, sent });
};
