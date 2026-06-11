import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

/** Liveness + database reachability for uptime monitors. No tenant data. */
export const GET = async () => {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
};
