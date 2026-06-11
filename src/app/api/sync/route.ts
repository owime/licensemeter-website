import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { apiAccess } from "~/server/access";
import { db } from "~/server/db";
import { syncRuns } from "~/server/db/schema";
import { runSync } from "~/server/sync/runSync";

export const maxDuration = 300;

/** Latest sync run for the caller's workspace (used for status polling). */
export const GET = async () => {
  const ctx = await apiAccess("viewer");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const latest = await db.query.syncRuns.findFirst({
    where: eq(syncRuns.tenantId, ctx.tenant.id),
    orderBy: desc(syncRuns.startedAt),
  });
  return NextResponse.json({
    run: latest
      ? {
          id: latest.id,
          status: latest.status,
          startedAt: latest.startedAt,
          finishedAt: latest.finishedAt,
          steps: latest.steps,
          error: latest.error,
        }
      : null,
  });
};

/** Manual "Sync now". */
export const POST = async () => {
  const ctx = await apiAccess("admin");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await runSync(ctx.tenant.id);
  revalidatePath("/app", "layout");
  return NextResponse.json(result);
};
