import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "~/server/auth/session";

export const POST = async (req: Request) => {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
};
