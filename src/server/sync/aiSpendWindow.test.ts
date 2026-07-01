import { describe, expect, it } from "vitest";

import { aiSpendSinceDay, dayMinus, dayString } from "./aiSpendWindow";

const now = new Date("2026-07-01T12:00:00Z");

describe("dayString / dayMinus", () => {
  it("formats and subtracts UTC days", () => {
    expect(dayString(now)).toBe("2026-07-01");
    expect(dayMinus("2026-07-01", 7)).toBe("2026-06-24");
    expect(dayMinus("2026-01-03", 5)).toBe("2025-12-29");
  });
});

describe("aiSpendSinceDay", () => {
  it("backfills the provider maximum on the first sync", () => {
    expect(aiSpendSinceDay(null, "openai", now)).toBe("2026-01-02");
    expect(aiSpendSinceDay(null, "anthropic", now)).toBe("2026-04-02");
  });

  it("re-pulls seven days before the newest stored day", () => {
    expect(aiSpendSinceDay("2026-06-30", "openai", now)).toBe("2026-06-23");
    expect(aiSpendSinceDay("2026-06-30", "anthropic", now)).toBe("2026-06-23");
  });

  it("extends over an outage gap longer than the re-pull window", () => {
    // Last stored day 30 days back: the window stays anchored to it.
    expect(aiSpendSinceDay("2026-06-01", "openai", now)).toBe("2026-05-25");
  });

  it("caps the lookback at 90 days after a very long outage", () => {
    expect(aiSpendSinceDay("2026-01-15", "openai", now)).toBe("2026-04-02");
    expect(aiSpendSinceDay("2026-01-15", "anthropic", now)).toBe("2026-04-02");
  });
});
