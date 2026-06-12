import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

/**
 * OAuth-cookie payload guard: the kind marker that branches the delegated
 * instant scan off the shared callback must be backward compatible (legacy
 * sign-in payloads carry no kind) and strict (only the exact literal "scan"
 * counts — anything else reads as a plain sign-in).
 */

// session.ts pulls ~/env at import; provide the only required test-env var
// before the dynamic import below. next/headers is request-scoped and never
// exercised by these tests.
process.env.AUTH_SECRET ??= "test-secret-test-secret";
vi.mock("next/headers", () => ({
  cookies: () => {
    throw new Error("cookies() must not be called in unit tests");
  },
}));

const { createOAuthToken, parseOAuthToken } = await import(
  "~/server/auth/session"
);

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

/** Signs a payload exactly like pre-scan deployments did. */
const legacyToken = (payload: Record<string, unknown>): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("600s")
    .sign(key);

describe("parseOAuthToken", () => {
  it("round-trips a scan payload", async () => {
    const token = await createOAuthToken({
      state: "s1",
      verifier: "v1",
      kind: "scan",
    });
    expect(await parseOAuthToken(token)).toEqual({
      state: "s1",
      verifier: "v1",
      kind: "scan",
    });
  });

  it("round-trips a sign-in payload without a kind", async () => {
    const token = await createOAuthToken({ state: "s2", verifier: "v2" });
    expect(await parseOAuthToken(token)).toEqual({ state: "s2", verifier: "v2" });
  });

  it("stays backward compatible with legacy payloads signed before the kind existed", async () => {
    const token = await legacyToken({ state: "s3", verifier: "v3" });
    const parsed = await parseOAuthToken(token);
    expect(parsed).toEqual({ state: "s3", verifier: "v3" });
    expect(parsed?.kind).toBeUndefined();
  });

  it("treats unknown kind values as plain sign-ins, never as scans", async () => {
    const token = await legacyToken({
      state: "s4",
      verifier: "v4",
      kind: "evil",
    });
    expect((await parseOAuthToken(token))?.kind).toBeUndefined();
  });

  it("rejects payloads missing state or verifier", async () => {
    expect(await parseOAuthToken(await legacyToken({ state: "s5" }))).toBeNull();
    expect(
      await parseOAuthToken(await legacyToken({ verifier: "v5" })),
    ).toBeNull();
  });

  it("rejects absent, garbage and wrongly-signed tokens", async () => {
    expect(await parseOAuthToken(undefined)).toBeNull();
    expect(await parseOAuthToken("not-a-jwt")).toBeNull();
    const foreign = await new SignJWT({ state: "s6", verifier: "v6" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("600s")
      .sign(new TextEncoder().encode("a-completely-different-signing-key"));
    expect(await parseOAuthToken(foreign)).toBeNull();
  });
});
