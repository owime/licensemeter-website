import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

/**
 * Stateless unsubscribe tokens: HMAC over the normalized email with a key
 * derived from AUTH_SECRET (same HKDF pattern as crypto.ts, own context).
 * Nothing to store or expire: a link stays valid until AUTH_SECRET rotates.
 * The secret arrives as an argument so this module stays env-free for tests.
 */
const key = (secret: string): Buffer =>
  Buffer.from(hkdfSync("sha256", secret, "licensemeter-unsub", "token-v1", 32));

export const makeUnsubToken = (email: string, secret: string): string =>
  createHmac("sha256", key(secret))
    .update(email.trim().toLowerCase())
    .digest("base64url");

export const verifyUnsubToken = (
  email: string,
  token: string,
  secret: string,
): boolean => {
  const expected = Buffer.from(makeUnsubToken(email, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
};
