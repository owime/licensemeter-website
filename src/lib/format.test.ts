import { describe, expect, it } from "vitest";

import { fmtAgo } from "./format";

describe("fmtAgo", () => {
  it("returns never for null", () => {
    expect(fmtAgo(null)).toBe("never");
  });

  it("formats past durations", () => {
    expect(fmtAgo(new Date(Date.now() - 5 * 60_000))).toBe("5 min ago");
    expect(fmtAgo(new Date(Date.now() - 3 * 60 * 60_000))).toBe("3 h ago");
    expect(fmtAgo(new Date(Date.now() - 48 * 60 * 60_000))).toBe("2 d ago");
  });

  it("clamps future timestamps to just now", () => {
    expect(fmtAgo(new Date(Date.now() + 10 * 60_000))).toBe("just now");
  });
});
