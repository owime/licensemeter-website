import { NextResponse, type NextRequest } from "next/server";

import {
  getSignInClient,
  SIGNIN_SCOPES,
  signInRedirectUri,
  type EntraIdTokenClaims,
} from "~/server/auth/msal";
import {
  createSessionToken,
  OAUTH_COOKIE,
  readOAuthCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "~/server/auth/session";

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

  let claims: EntraIdTokenClaims;
  try {
    const result = await getSignInClient().acquireTokenByCode({
      code,
      scopes: SIGNIN_SCOPES,
      redirectUri: signInRedirectUri(),
      codeVerifier: oauth.verifier,
    });
    claims = result.idTokenClaims ?? {};
  } catch (err) {
    return backToLanding(
      req,
      `token redemption failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!claims.oid || !claims.tid) {
    return backToLanding(req, "id_token missing oid/tid claims");
  }

  const upn = claims.preferred_username ?? claims.email ?? "";
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
