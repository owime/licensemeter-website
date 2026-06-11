import { NextResponse } from "next/server";

import { isSameOrigin } from "~/server/auth/origin";
import { SESSION_COOKIE } from "~/server/auth/session";

export const POST = async (req: Request) => {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
};
