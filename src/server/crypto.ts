import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

import { env } from "~/env";

/**
 * AES-256-GCM for third-party credentials at rest (Adobe client secrets).
 * Key derived from AUTH_SECRET via HKDF so no extra key material is managed;
 * rotating AUTH_SECRET invalidates stored secrets (documented trade-off:
 * customers simply re-enter the Adobe credential).
 */
const key = (): Buffer =>
  Buffer.from(
    hkdfSync("sha256", env.AUTH_SECRET, "licensemeter-adobe", "secret-v1", 32),
  );

export const encryptSecret = (plain: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${ct.toString("base64")}`;
};

export const decryptSecret = (enc: string): string => {
  const [iv, tag, ct] = enc.split(".");
  if (!iv || !tag || !ct) throw new Error("Malformed encrypted secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
};
