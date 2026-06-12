import { describe, expect, it } from "vitest";

import {
  computeAiSpendDelta,
  computeDigestDelta,
  daysUntilDate,
  daysUntilRenewal,
  renewalPhrase,
  type DeltaFindingRow,
} from "~/server/digestDelta";

const NOW = new Date("2026-06-12T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const row = (overrides: Partial<DeltaFindingRow>): DeltaFindingRow => ({
  status: "open",
  firstSeenAt: new Date(NOW.getTime() - 30 * DAY_MS),
  resolvedAt: null,
  monthlyImpactCents: 1000,
  ...overrides,
});

describe("computeDigestDelta", () => {
  it("returns all zeros for no rows", () => {
    expect(computeDigestDelta([], NOW)).toEqual({
      newCount: 0,
      newCents: 0,
      resolvedCount: 0,
      resolvedCents: 0,
    });
  });

  it("counts open and acknowledged findings first seen within 7 days and sums their cents", () => {
    const delta = computeDigestDelta(
      [
        row({
          status: "open",
          firstSeenAt: new Date(NOW.getTime() - 2 * DAY_MS),
          monthlyImpactCents: 2500,
        }),
        row({
          status: "acknowledged",
          firstSeenAt: new Date(NOW.getTime() - 6 * DAY_MS),
          monthlyImpactCents: 1500,
        }),
        // Old open finding: part of the standing total, not the delta.
        row({ status: "open", monthlyImpactCents: 99_999 }),
      ],
      NOW,
    );
    expect(delta.newCount).toBe(2);
    expect(delta.newCents).toBe(4000);
    expect(delta.resolvedCount).toBe(0);
    expect(delta.resolvedCents).toBe(0);
  });

  it("includes the exact 7-day boundary and excludes anything older", () => {
    const delta = computeDigestDelta(
      [
        row({ firstSeenAt: new Date(NOW.getTime() - 7 * DAY_MS) }),
        row({ firstSeenAt: new Date(NOW.getTime() - 7 * DAY_MS - 1) }),
      ],
      NOW,
    );
    expect(delta.newCount).toBe(1);
  });

  it("counts recently resolved findings, boundary inclusive", () => {
    const delta = computeDigestDelta(
      [
        row({
          status: "resolved",
          resolvedAt: new Date(NOW.getTime() - 7 * DAY_MS),
          monthlyImpactCents: 800,
        }),
        row({
          status: "resolved",
          resolvedAt: new Date(NOW.getTime() - 7 * DAY_MS - 1),
          monthlyImpactCents: 600,
        }),
      ],
      NOW,
    );
    expect(delta.resolvedCount).toBe(1);
    expect(delta.resolvedCents).toBe(800);
  });

  it("does not count a reopened finding with a stale resolvedAt as resolved", () => {
    const delta = computeDigestDelta(
      [
        // Auto-resolved by a sync, then manually reopened in the UI — the
        // status actions do not clear resolvedAt.
        row({
          status: "open",
          firstSeenAt: new Date(NOW.getTime() - 30 * DAY_MS),
          resolvedAt: new Date(NOW.getTime() - 2 * DAY_MS),
        }),
      ],
      NOW,
    );
    expect(delta.newCount).toBe(0);
    expect(delta.resolvedCount).toBe(0);
  });

  it("does not count a resolved finding as new even when it first appeared this week", () => {
    const delta = computeDigestDelta(
      [
        row({
          status: "resolved",
          firstSeenAt: new Date(NOW.getTime() - 3 * DAY_MS),
          resolvedAt: new Date(NOW.getTime() - 1 * DAY_MS),
          monthlyImpactCents: 1200,
        }),
      ],
      NOW,
    );
    expect(delta.newCount).toBe(0);
    expect(delta.resolvedCount).toBe(1);
    expect(delta.resolvedCents).toBe(1200);
  });
});

describe("daysUntilRenewal", () => {
  it("returns null when the renewal date is unset", () => {
    expect(daysUntilRenewal(null, NOW)).toBeNull();
  });

  it("returns null for a past date", () => {
    expect(daysUntilRenewal("2026-06-11", NOW)).toBeNull();
    expect(daysUntilRenewal("2024-01-01", NOW)).toBeNull();
  });

  it("returns 0 for today regardless of the time of day", () => {
    expect(daysUntilRenewal("2026-06-12", NOW)).toBe(0);
  });

  it("includes exactly 90 days out", () => {
    expect(daysUntilRenewal("2026-09-10", NOW)).toBe(90);
  });

  it("returns null beyond the 90-day window", () => {
    expect(daysUntilRenewal("2026-09-11", NOW)).toBeNull();
    expect(daysUntilRenewal("2030-01-01", NOW)).toBeNull();
  });

  it("counts whole calendar days", () => {
    expect(daysUntilRenewal("2026-06-13", NOW)).toBe(1);
    expect(daysUntilRenewal("2026-07-12", NOW)).toBe(30);
  });

  it("returns null for a malformed date string", () => {
    expect(daysUntilRenewal("not-a-date", NOW)).toBeNull();
  });
});

describe("daysUntilDate", () => {
  it("returns negative days for past dates, null for unset and malformed", () => {
    expect(daysUntilDate("2026-06-10", NOW)).toBe(-2);
    expect(daysUntilDate(null, NOW)).toBeNull();
    expect(daysUntilDate("not-a-date", NOW)).toBeNull();
  });
});

describe("renewalPhrase", () => {
  it("handles today, one day, and many days", () => {
    expect(renewalPhrase(0)).toBe("Renewal today");
    expect(renewalPhrase(1)).toBe("Renewal in 1 day");
    expect(renewalPhrase(45)).toBe("Renewal in 45 days");
  });
});

describe("computeAiSpendDelta", () => {
  it("returns zeros for no rows", () => {
    expect(computeAiSpendDelta([], NOW)).toEqual({
      last7Cents: 0,
      prior7Cents: 0,
    });
  });

  it("counts today in the last-7 bucket", () => {
    expect(
      computeAiSpendDelta([{ day: "2026-06-12", amountCents: 500 }], NOW),
    ).toEqual({ last7Cents: 500, prior7Cents: 0 });
  });

  it("puts exactly 7 days old in the prior bucket, 6 days old in last-7", () => {
    expect(
      computeAiSpendDelta(
        [
          { day: "2026-06-06", amountCents: 300 }, // age 6
          { day: "2026-06-05", amountCents: 700 }, // age 7
        ],
        NOW,
      ),
    ).toEqual({ last7Cents: 300, prior7Cents: 700 });
  });

  it("includes age 13 in the prior bucket and ignores age 14", () => {
    expect(
      computeAiSpendDelta(
        [
          { day: "2026-05-30", amountCents: 400 }, // age 13
          { day: "2026-05-29", amountCents: 9_999 }, // age 14
        ],
        NOW,
      ),
    ).toEqual({ last7Cents: 0, prior7Cents: 400 });
  });

  it("ignores malformed day strings", () => {
    expect(
      computeAiSpendDelta([{ day: "not-a-date", amountCents: 1000 }], NOW),
    ).toEqual({ last7Cents: 0, prior7Cents: 0 });
  });

  it("sums multiple rows on the same day", () => {
    expect(
      computeAiSpendDelta(
        [
          { day: "2026-06-10", amountCents: 250 },
          { day: "2026-06-10", amountCents: 150 },
        ],
        NOW,
      ),
    ).toEqual({ last7Cents: 400, prior7Cents: 0 });
  });
});
