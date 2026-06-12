import { NextResponse } from "next/server";

import { isSameOrigin } from "~/server/auth/origin";
import { expiredSessionCookie } from "~/server/auth/session";

export const POST = async (req: Request) => {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  // Expire with full attributes: a bare delete() lacks Secure and the
  // browser would reject it for the prod __Host- cookie name.
  res.cookies.set(expiredSessionCookie());
  return res;
};
