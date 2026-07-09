import { describe, expect, it } from "vitest";

import { isValidIsoDate } from "~/lib/isoDate";

describe("isValidIsoDate", () => {
  it("accepts real calendar dates including leap day", () => {
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-12-31")).toBe(true);
  });

  it("rejects rollovers, malformed values and out-of-range years", () => {
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-04-31")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("26-01-01")).toBe(false);
    expect(isValidIsoDate("1999-12-31")).toBe(false);
    expect(isValidIsoDate("2101-01-01")).toBe(false);
  });
});
