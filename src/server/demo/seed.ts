import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { memberships, snapshots, syncRuns, tenants } from "~/server/db/schema";
import { runSync } from "~/server/sync/runSync";
import { DEMO_EMAIL, DEMO_OID, DEMO_TID } from "./constants";

/**
 * Creates the demo workspace on first demo sign-in and runs the initial sync
 * against the fixture Graph client so the dashboard is populated immediately.
 * Deduplicated per process: layout and page render concurrently in the App
 * Router, and both resolve access (and would both seed) on first load.
 */
let seeding: Promise<void> | null = null;

export const ensureDemoWorkspace = (): Promise<void> => {
  // Successful seeds stay latched for the process lifetime (idempotent checks
  // are cheap but pointless to repeat); failures reset so the next request retries.
  seeding ??= seedDemoWorkspace().catch((err) => {
    seeding = null;
    throw err;
  });
  return seeding;
};

const seedDemoWorkspace = async (): Promise<void> => {
  let tenant = await db.query.tenants.findFirst({
    where: eq(tenants.tid, DEMO_TID),
  });

  if (!tenant) {
    // No conflict target: tenants_tid_idx is a partial unique index
    // (WHERE tid IS NOT NULL), which Postgres will not accept as an ON CONFLICT
    // arbiter. A bare DO NOTHING swallows the tid race harmlessly — the only
    // unique column this insert sets — matching scan.ts / csv upload.
    const inserted = await db
      .insert(tenants)
      .values({
        tid: DEMO_TID,
        name: "Meridian Industries GmbH (Demo)",
        isDemo: true,
        consentedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    tenant =
      inserted[0] ??
      (await db.query.tenants.findFirst({ where: eq(tenants.tid, DEMO_TID) }));
  }
  if (!tenant) throw new Error("Failed to create demo tenant");

  const member = await db.query.memberships.findFirst({
    where: eq(memberships.tenantId, tenant.id),
  });
  if (!member) {
    await db
      .insert(memberships)
      .values({
        tenantId: tenant.id,
        oid: DEMO_OID,
        email: DEMO_EMAIL,
        name: "Demo Admin",
        role: "owner",
      })
      .onConflictDoNothing();
  }

  const anyRun = await db.query.syncRuns.findFirst({
    where: eq(syncRuns.tenantId, tenant.id),
  });
  if (!anyRun) {
    await seedDemoHistory(tenant.id);
    await runSync(tenant.id);
  }
};

/**
 * 45 days of synthetic snapshot history so the demo shows the trend chart
 * (a real tenant accumulates these nightly). Waste drifts down, the story
 * the product sells. Deterministic; today's row is overwritten by the sync.
 */
const seedDemoHistory = async (tenantId: string): Promise<void> => {
  const today = new Date();
  const rows = Array.from({ length: 45 }, (_, i) => {
    const day = new Date(today.getTime() - (45 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const wobble = Math.sin(i * 1.7) * 9_000;
    return {
      tenantId,
      day,
      totalMonthlySpendCents: 697_990 + Math.round(Math.sin(i * 0.9) * 12_000),
      totalMonthlyWasteCents: Math.max(
        Math.round(310_000 - i * 1_500 + wobble),
        200_000,
      ),
      purchasedSeats: 300,
      assignedSeats: 263,
      bySku: {},
    };
  });
  await db.insert(snapshots).values(rows).onConflictDoNothing();
};
