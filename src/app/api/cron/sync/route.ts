import { timingSafeEqual } from "node:crypto";

import { isNotNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { tenants } from "~/server/db/schema";
import { runSync } from "~/server/sync/runSync";

export const maxDuration = 300;

/** Constant-time bearer check; a length mismatch is false, never a throw. */
const authorized = (req: NextRequest, secret: string): boolean => {
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/** Nightly sync across all connected tenants. Protected by CRON_SECRET. */
export const GET = async (req: NextRequest) => {
  if (!env.CRON_SECRET || !authorized(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // CSV-trial workspaces (consentedAt null) have no Graph access. Syncing
  // them could only fail. The demo tenant has consentedAt set by its seed.
  const allTenants = await db.query.tenants.findMany({
    where: isNotNull(tenants.consentedAt),
  });

  // Bounded concurrency: sequential syncs would exceed maxDuration once a
  // handful of tenants are connected (worst case ~45s each on retry paths).
  const CONCURRENCY = 3;
  const results: { tenantId: string; status: string }[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < allTenants.length) {
      const tenant = allTenants[cursor++]!;
      try {
        const result = await runSync(tenant.id);
        results.push({ tenantId: tenant.id, status: result.status });
      } catch (err) {
        console.error(`[cron] sync failed for ${tenant.id}`, err);
        results.push({ tenantId: tenant.id, status: "failed" });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, allTenants.length) }, worker),
  );

  return NextResponse.json({ synced: results.length, results });
};
