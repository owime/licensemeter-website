import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { snapshots, tenants } from "~/server/db/schema";

export type ScanStats = {
  /** Consented, non-demo tenants: what "connected" means in the copy. */
  tenants: number;
  /** Mean latest-snapshot waste share across those tenants, in percent (one decimal). */
  avgWastePct: number;
};

/**
 * Truthful social-proof aggregate for the static landing page, read once per
 * build/ISR revalidation. Returns null until the figures are worth quoting
 * (at least 5 consenting tenants and a sane average), and on ANY failure,
 * because a database hiccup at build time must never break the build. The
 * caller renders nothing for null.
 */
export const getScanStats = async (): Promise<ScanStats | null> => {
  try {
    const consented = () =>
      and(eq(tenants.isDemo, false), isNotNull(tenants.consentedAt));

    const [countRows, latestSnapshots] = await Promise.all([
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(tenants)
        .where(consented()),
      // Latest snapshot per tenant: DISTINCT ON over (tenant, day desc).
      // Both production Postgres and the PGlite dev fallback support it.
      db
        .selectDistinctOn([snapshots.tenantId], {
          spendCents: snapshots.totalMonthlySpendCents,
          wasteCents: snapshots.totalMonthlyWasteCents,
        })
        .from(snapshots)
        .innerJoin(tenants, eq(tenants.id, snapshots.tenantId))
        .where(consented())
        .orderBy(snapshots.tenantId, desc(snapshots.day)),
    ]);

    const tenantCount = countRows[0]?.n ?? 0;
    const ratios = latestSnapshots
      .filter((s) => s.spendCents > 0)
      .map((s) => (s.wasteCents / s.spendCents) * 100);
    if (tenantCount < 5 || ratios.length === 0) return null;

    const avg = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    if (!Number.isFinite(avg) || avg <= 0 || avg >= 80) return null;

    return { tenants: tenantCount, avgWastePct: Math.round(avg * 10) / 10 };
  } catch {
    // Build-time resilience: no stats line is always better than no build.
    return null;
  }
};
