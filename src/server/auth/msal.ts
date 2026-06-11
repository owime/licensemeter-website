import { ConfidentialClientApplication, CryptoProvider } from "@azure/msal-node";

import { appBaseUrl, env } from "~/env";

/**
 * MSAL confidential client for the multi-tenant web sign-in (auth-code flow
 * with PKCE against /organizations — work and school accounts from any
 * tenant, personal accounts blocked). The connector's app-only client lives
 * separately in server/graph/msGraph.ts.
 */

export const SIGNIN_SCOPES = ["openid", "profile", "email"];

export const signInRedirectUri = () =>
  // Path kept identical to the app registration created by setup-entra.ps1.
  `${appBaseUrl()}/api/auth/callback/microsoft-entra-id`;

let app: ConfidentialClientApplication | null = null;

export const getSignInClient = (): ConfidentialClientApplication => {
  if (!env.AUTH_MICROSOFT_ENTRA_ID_ID || !env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
    throw new Error(
      "AUTH_MICROSOFT_ENTRA_ID_ID / AUTH_MICROSOFT_ENTRA_ID_SECRET are not configured",
    );
  }
  app ??= new ConfidentialClientApplication({
    auth: {
      clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      authority: "https://login.microsoftonline.com/organizations",
    },
  });
  return app;
};

export const msalCrypto = new CryptoProvider();

/** The id_token claims this app consumes. */
export type EntraIdTokenClaims = {
  oid?: string;
  tid?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
};
