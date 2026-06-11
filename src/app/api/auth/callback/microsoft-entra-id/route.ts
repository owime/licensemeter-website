import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import {
  getSignInClient,
  SIGNIN_SCOPES,
  signInRedirectUri,
} from "~/server/auth/msal";
import { verifyEntraIdToken, type VerifiedEntraClaims } from "~/server/auth/verifyIdToken";
import {
  createSessionToken,
  OAUTH_COOKIE,
  readOAuthCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "~/server/auth/session";
import { db } from "~/server/db";
import { seenSignins } from "~/server/db/schema";
import { notifyOps } from "~/server/ops";
import { sql } from "drizzle-orm";

const backToLanding = (req: NextRequest, reason: string) => {
  console.error(`[auth] sign-in failed: ${reason}`);
  const res = NextResponse.redirect(new URL(`/?signin=failed`, req.url));
  res.cookies.delete(OAUTH_COOKIE);
  return res;
};

/**
 * Auth-code redirect leg: validate state, redeem the code via MSAL (which
 * performs the token exchange over TLS directly with Entra), establish the
 * session from the id_token claims.
 */
export const GET = async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    return backToLanding(req, `${error}: ${params.get("error_description") ?? ""}`);
  }

  const oauth = await readOAuthCookie();
  if (!oauth) return backToLanding(req, "missing or expired oauth cookie");
  if (!code || !state || state !== oauth.state) {
    return backToLanding(req, "state mismatch");
  }

  let claims: VerifiedEntraClaims;
  try {
    const result = await getSignInClient().acquireTokenByCode({
      code,
      scopes: SIGNIN_SCOPES,
      redirectUri: signInRedirectUri(),
      codeVerifier: oauth.verifier,
    });
    // Signature + audience + per-tenant issuer verification (Microsoft JWKS).
    claims = await verifyEntraIdToken(
      result.idToken,
      env.AUTH_MICROSOFT_ENTRA_ID_ID ?? "",
    );
  } catch (err) {
    return backToLanding(
      req,
      `token redemption failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const upn = claims.preferred_username ?? claims.email ?? "";

  // First-time identities are a founder signal; returning ones just update stats.
  try {
    const inserted = await db
      .insert(seenSignins)
      .values({ oid: claims.oid, tid: claims.tid, upn })
      .onConflictDoUpdate({
        target: seenSignins.oid,
        set: {
          lastSeenAt: new Date(),
          upn,
          signinCount: sql`${seenSignins.signinCount} + 1`,
        },
      })
      .returning({ count: seenSignins.signinCount });
    if (inserted[0]?.count === 1) {
      void notifyOps(`first sign-in: ${upn} (tenant ${claims.tid})`);
    }
  } catch (err) {
    console.error("[auth] sign-in tracking failed", err);
  }

  const token = await createSessionToken({
    oid: claims.oid,
    tid: claims.tid,
    upn,
    name: claims.name ?? upn,
    email: claims.email ?? claims.preferred_username ?? null,
    isDemo: false,
  });

  const res = NextResponse.redirect(new URL("/app", req.url));
  res.cookies.delete(OAUTH_COOKIE);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
};
