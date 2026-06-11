import { NextResponse } from "next/server";

import { env } from "~/env";
import {
  getSignInClient,
  msalCrypto,
  SIGNIN_SCOPES,
  signInRedirectUri,
} from "~/server/auth/msal";
import {
  createOAuthToken,
  OAUTH_COOKIE,
  oauthCookieOptions,
} from "~/server/auth/session";

/** Starts the Microsoft sign-in: PKCE + state into a short-lived cookie, redirect to Entra. */
export const GET = async (req: Request) => {
  if (!env.AUTH_MICROSOFT_ENTRA_ID_ID) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { verifier, challenge } = await msalCrypto.generatePkceCodes();
  const state = crypto.randomUUID();

  const authUrl = await getSignInClient().getAuthCodeUrl({
    scopes: SIGNIN_SCOPES,
    redirectUri: signInRedirectUri(),
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(
    OAUTH_COOKIE,
    await createOAuthToken({ state, verifier }),
    oauthCookieOptions(),
  );
  return res;
};
