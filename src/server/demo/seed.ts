import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { memberships, syncRuns, tenants } from "~/server/db/schema";
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
  seeding ??= seedDemoWorkspace().finally(() => {
    seeding = null;
  });
  return seeding;
};

const seedDemoWorkspace = async (): Promise<void> => {
  let tenant = await db.query.tenants.findFirst({
    where: eq(tenants.tid, DEMO_TID),
  });

  if (!tenant) {
    const inserted = await db
      .insert(tenants)
      .values({
        tid: DEMO_TID,
        name: "Meridian Industries GmbH (Demo)",
        isDemo: true,
        consentedAt: new Date(),
      })
      .onConflictDoNothing({ target: tenants.tid })
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
  if (!anyRun) await runSync(tenant.id);
};
