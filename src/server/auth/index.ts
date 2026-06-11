import NextAuth, { type DefaultSession } from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import { decodeJwt } from "jose";

import { env, isDemoMode } from "~/env";
import { DEMO_EMAIL, DEMO_OID, DEMO_TID } from "~/server/demo/constants";

declare module "next-auth" {
  interface Session {
    user: {
      /** Entra object id (or the demo constant). */
      oid: string;
      /** Entra tenant id (or the demo constant). */
      tid: string;
      /** UPN / preferred_username. */
      upn: string;
      isDemo: boolean;
    } & DefaultSession["user"];
  }
}

type EntraProfile = {
  sub: string;
  oid?: string;
  tid?: string;
  aud?: string;
  iss?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
};

/**
 * Multi-tenant Entra ID sign-in via the /organizations endpoint (work and
 * school accounts from any tenant; personal accounts blocked).
 *
 * Configured as a plain OAuth provider because Auth.js's strict OIDC issuer
 * check cannot handle Entra's per-tenant issuers. The ID token arrives over
 * TLS directly from the token endpoint, so decoding without a local signature
 * check is sound; audience and tenant claims are validated below.
 */
const entraMultiTenant = (): OAuthConfig<EntraProfile> => ({
  id: "microsoft-entra-id",
  name: "Microsoft",
  type: "oauth",
  clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
  clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
  authorization: {
    url: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    params: { scope: "openid profile email" },
  },
  token: "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
  client: { token_endpoint_auth_method: "client_secret_post" },
  checks: ["pkce", "state"],
  userinfo: {
    url: "https://graph.microsoft.com/oidc/userinfo",
    async request({ tokens }: { tokens: { id_token?: string } }) {
      if (!tokens.id_token) throw new Error("Missing id_token");
      const claims = decodeJwt(tokens.id_token) as EntraProfile;
      if (claims.aud !== env.AUTH_MICROSOFT_ENTRA_ID_ID) {
        throw new Error("id_token audience mismatch");
      }
      if (!claims.tid || !claims.oid) {
        throw new Error("id_token missing tid/oid claims");
      }
      if (claims.iss !== `https://login.microsoftonline.com/${claims.tid}/v2.0`) {
        throw new Error("id_token issuer mismatch");
      }
      return claims;
    },
  },
  profile(profile) {
    return {
      id: profile.oid ?? profile.sub,
      name: profile.name ?? profile.preferred_username ?? "Unknown",
      email: profile.email ?? profile.preferred_username ?? null,
    };
  },
});

/** Credentials-free demo entry; only active when DEMO_MODE=true. */
const demoProvider = Credentials({
  id: "demo",
  name: "Demo workspace",
  credentials: {},
  authorize() {
    if (!isDemoMode()) return null;
    return { id: DEMO_OID, name: "Demo Admin", email: DEMO_EMAIL };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [entraMultiTenant(), demoProvider],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.provider === "demo") {
        token.oid = DEMO_OID;
        token.tid = DEMO_TID;
        token.upn = DEMO_EMAIL;
        token.isDemo = true;
      } else if (account && profile) {
        const p = profile as EntraProfile;
        token.oid = p.oid ?? p.sub;
        token.tid = p.tid;
        token.upn = p.preferred_username ?? p.email ?? "";
        token.isDemo = false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.oid = (token.oid as string) ?? "";
      session.user.tid = (token.tid as string) ?? "";
      session.user.upn = (token.upn as string) ?? "";
      session.user.isDemo = (token.isDemo as boolean) ?? false;
      return session;
    },
  },
});
