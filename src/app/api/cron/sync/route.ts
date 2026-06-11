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
  const results: { tenantId: string; status: string }[] = [];
  for (const tenant of allTenants) {
    try {
      const result = await runSync(tenant.id);
      results.push({ tenantId: tenant.id, status: result.status });
    } catch (err) {
      results.push({
        tenantId: tenant.id,
        status: `failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }
  return NextResponse.json({ synced: results.length, results });
};
