import { describe, expect, it } from "vitest";

import {
  breakEvenSeats,
  computeRoi,
  DEMO_WASTE_PCT,
  parseEuroToCents,
  parseSeats,
  pickPlan,
} from "./roiMath";

describe("pickPlan boundaries", () => {
  it("mirrors the published tiers: <=250 Starter, <=1000 Growth, else Scale", () => {
    expect(pickPlan(25).name).toBe("Starter");
    expect(pickPlan(250).name).toBe("Starter");
    expect(pickPlan(251).name).toBe("Growth");
    expect(pickPlan(1000).name).toBe("Growth");
    expect(pickPlan(1001).name).toBe("Scale");
    expect(pickPlan(5000).name).toBe("Scale");
  });
});

describe("computeRoi", () => {
  it("computes the defaults (250 seats, 36.70 EUR, 8 percent) in exact cents", () => {
    const r = computeRoi(250, 3670, 8);
    // 250 * 3670 = 917500 cents spend; 8% = 73400 cents
    expect(r.monthlyWasteCents).toBe(73400);
    expect(r.annualWasteCents).toBe(880800);
    expect(r.plan.name).toBe("Starter");
    expect(r.plan.priceEur).toBe(79);
    expect(r.paysOff).toBe(true);
  });

  it("is honest when the assumed waste stays under the plan price", () => {
    const r = computeRoi(25, 3670, 8);
    expect(r.monthlyWasteCents).toBe(7340); // < 7900 cents Starter price
    expect(r.paysOff).toBe(false);
    expect(r.breakEvenSeats).toBe(27);
    // Break-even is minimal: pays off at 27 seats, not at 26.
    expect(computeRoi(27, 3670, 8).paysOff).toBe(true);
    expect(computeRoi(26, 3670, 8).paysOff).toBe(false);
  });

  it("returns zero waste and no break-even for a zero cost per seat", () => {
    const r = computeRoi(250, 0, 8);
    expect(r.monthlyWasteCents).toBe(0);
    expect(r.paysOff).toBe(false);
    expect(r.breakEvenSeats).toBeNull();
  });
});

describe("breakEvenSeats", () => {
  it("falls through to the plan that applies at the break-even size", () => {
    // 10 EUR/seat at 1%: Starter would need 790 seats (> 250 cap),
    // Growth would need 1990 (> 1000 cap), Scale needs 4990.
    expect(breakEvenSeats(1000, 1)).toBe(4990);
    const atBreakEven = computeRoi(4990, 1000, 1);
    expect(atBreakEven.plan.name).toBe("Scale");
    expect(atBreakEven.paysOff).toBe(true);
    expect(computeRoi(4989, 1000, 1).paysOff).toBe(false);
  });

  it("handles exact divisibility without overshooting by one", () => {
    // 3.95 EUR/seat at 10%: 79 EUR / 0.395 EUR = exactly 200 seats.
    expect(breakEvenSeats(395, 10)).toBe(200);
    expect(computeRoi(200, 395, 10).paysOff).toBe(true);
    expect(computeRoi(199, 395, 10).paysOff).toBe(false);
  });

  it("returns null when the assumption can never produce waste", () => {
    expect(breakEvenSeats(0, 8)).toBeNull();
  });
});

describe("input parsing", () => {
  it("accepts dot and comma decimals for euros and rejects junk", () => {
    expect(parseEuroToCents("36.70")).toBe(3670);
    expect(parseEuroToCents("36,70")).toBe(3670);
    expect(parseEuroToCents("12")).toBe(1200);
    expect(parseEuroToCents("")).toBe(0);
    expect(parseEuroToCents("abc")).toBe(0);
    expect(parseEuroToCents("-5")).toBe(0);
  });

  it("parses seats as whole non-negative numbers", () => {
    expect(parseSeats("250")).toBe(250);
    expect(parseSeats("12.7")).toBe(12);
    expect(parseSeats("")).toBe(0);
    expect(parseSeats("-40")).toBe(0);
    expect(parseSeats("99999999")).toBe(1_000_000);
  });
});

describe("DEMO_WASTE_PCT", () => {
  it("matches the demo tenant the marketing pages quote (43 percent)", () => {
    // 297986 / 697990, recomputed so the slider hint cannot go stale.
    expect(DEMO_WASTE_PCT).toBe(43);
  });
});
