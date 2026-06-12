import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "~/env";

/**
 * Cookie-based sessions, MSAL-friendly: a compact HS256 JWT holding only the
 * user's own identity claims (nothing confidential to its holder).
 */

/**
 * __Host- prefix in production locks the cookie to this exact host over HTTPS
 * (no subdomain override). Plain names in dev where http://localhost is used.
 */
const isProd = env.NODE_ENV === "production";
export const SESSION_COOKIE = isProd ? "__Host-lm_session" : "lm_session";
export const OAUTH_COOKIE = isProd ? "__Host-lm_oauth" : "lm_oauth";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const OAUTH_MAX_AGE = 10 * 60; // state+verifier live only for the redirect leg

const key = new TextEncoder().encode(env.AUTH_SECRET);

export type SessionUser = {
  /** Entra object id (or the demo constant). */
  oid: string;
  /** Entra tenant id (or the demo constant). */
  tid: string;
  /** UPN / preferred_username. */
  upn: string;
  name: string;
  email: string | null;
  isDemo: boolean;
};

export type Session = { user: SessionUser };

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export const sessionCookieOptions = () => cookieOptions(SESSION_MAX_AGE);
export const oauthCookieOptions = () => cookieOptions(OAUTH_MAX_AGE);

export const createSessionToken = async (user: SessionUser): Promise<string> =>
  new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);

/**
 * Which redirect flow the OAuth cookie belongs to. Absent (legacy payloads
 * and the regular sign-in) means sign-in; "scan" marks the delegated
 * instant-scan flow, which shares the registered redirect URI.
 */
export type OAuthFlowKind = "scan";

export type OAuthPayload = {
  state: string;
  verifier: string;
  kind?: OAuthFlowKind;
};

/** State + PKCE verifier for the in-flight OAuth redirect, integrity-protected. */
export const createOAuthToken = async (
  payload: OAuthPayload,
): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_MAX_AGE}s`)
    .sign(key);

const verifyToken = async <T>(token: string | undefined): Promise<T | null> => {
  if (!token) return null;
  try {
    // Pin to the exact algorithm used at issuance.
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
};

/** Current session from the request cookies; null when absent or invalid. */
export const auth = async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifyToken<SessionUser>(token);
  if (!payload?.oid || !payload?.tid) return null;
  return {
    user: {
      oid: payload.oid,
      tid: payload.tid,
      upn: payload.upn ?? "",
      name: payload.name ?? "",
      email: payload.email ?? null,
      isDemo: payload.isDemo ?? false,
    },
  };
};

/**
 * Verifies and shapes an OAuth-cookie token. Backward compatible: payloads
 * signed without a kind (in-flight sign-ins from before the scan flow
 * shipped) still verify and read as plain sign-ins; any unknown kind value
 * is treated as a sign-in too, never as a scan.
 */
export const parseOAuthToken = async (
  token: string | undefined,
): Promise<OAuthPayload | null> => {
  const payload = await verifyToken<{
    state?: string;
    verifier?: string;
    kind?: string;
  }>(token);
  if (!payload?.state || !payload?.verifier) return null;
  return {
    state: payload.state,
    verifier: payload.verifier,
    ...(payload.kind === "scan" ? { kind: "scan" as const } : {}),
  };
};

export const readOAuthCookie = async (): Promise<OAuthPayload | null> =>
  parseOAuthToken((await cookies()).get(OAUTH_COOKIE)?.value);

/** For server actions (sign out from the sidebar). */
export const clearSessionCookie = async (): Promise<void> => {
  (await cookies()).delete(SESSION_COOKIE);
};
