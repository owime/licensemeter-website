import { describe, expect, it } from "vitest";

import { makeUnsubToken, verifyUnsubToken } from "~/server/unsubToken";

const SECRET = "test-secret-at-least-32-characters-long";

describe("unsubscribe tokens", () => {
  it("round-trips for the same email and secret", () => {
    const token = makeUnsubToken("user@example.com", SECRET);
    expect(verifyUnsubToken("user@example.com", token, SECRET)).toBe(true);
  });

  it("normalizes case and whitespace like the capture action", () => {
    const token = makeUnsubToken("  User@Example.COM ", SECRET);
    expect(verifyUnsubToken("user@example.com", token, SECRET)).toBe(true);
  });

  it("rejects a tampered token", () => {
    const token = makeUnsubToken("user@example.com", SECRET);
    const flipped = (token.startsWith("A") ? "B" : "A") + token.slice(1);
    expect(verifyUnsubToken("user@example.com", flipped, SECRET)).toBe(false);
    expect(verifyUnsubToken("user@example.com", "", SECRET)).toBe(false);
  });

  it("does not transfer between emails or secrets", () => {
    const token = makeUnsubToken("user@example.com", SECRET);
    expect(verifyUnsubToken("other@example.com", token, SECRET)).toBe(false);
    expect(verifyUnsubToken("user@example.com", token, "another-secret-32-characters-long!")).toBe(false);
  });
});
