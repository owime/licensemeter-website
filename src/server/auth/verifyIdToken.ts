import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Defense in depth on top of MSAL's TLS-direct token redemption: verify the
 * id_token signature against Microsoft's published JWKS and pin audience,
 * algorithm and the per-tenant issuer pattern.
 */
const JWKS = createRemoteJWKSet(
  new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"),
);

export type VerifiedEntraClaims = {
  oid: string;
  tid: string;
  name?: string;
  email?: string;
  preferred_username?: string;
};

export const verifyEntraIdToken = async (
  rawToken: string,
  expectedAudience: string,
): Promise<VerifiedEntraClaims> => {
  const { payload } = await jwtVerify(rawToken, JWKS, {
    audience: expectedAudience,
    algorithms: ["RS256"],
  });
  const claims = payload as Record<string, unknown>;
  const oid = typeof claims.oid === "string" ? claims.oid : null;
  const tid = typeof claims.tid === "string" ? claims.tid : null;
  if (!oid || !tid) throw new Error("id_token missing oid/tid");
  if (claims.iss !== `https://login.microsoftonline.com/${tid}/v2.0`) {
    throw new Error("id_token issuer does not match tid");
  }
  return {
    oid,
    tid,
    name: typeof claims.name === "string" ? claims.name : undefined,
    email: typeof claims.email === "string" ? claims.email : undefined,
    preferred_username:
      typeof claims.preferred_username === "string"
        ? claims.preferred_username
        : undefined,
  };
};
