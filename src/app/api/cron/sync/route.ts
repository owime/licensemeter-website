import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { runSync } from "~/server/sync/runSync";

export const maxDuration = 300;

/** Nightly sync across all connected tenants. Protected by CRON_SECRET. */
export const GET = async (req: NextRequest) => {
  if (
    !env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const allTenants = await db.query.tenants.findMany();

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
