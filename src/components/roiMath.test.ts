import { describe, expect, it } from "vitest";

import {
  breakEvenSeats,
  computeRoi,
  DEMO_WASTE_PCT,
  OVER_CAP,
  parseEuroToCents,
  parseSeats,
  pickPlan,
} from "./roiMath";

/** Plan name of a pick, or the over-cap marker itself. */
const pickName = (seats: number): string => {
  const pick = pickPlan(seats);
  return pick === OVER_CAP ? pick : pick.name;
};

describe("pickPlan boundaries", () => {
  it("mirrors the published tiers: <=250 Starter, <=1000 Growth, <=2500 Scale, above that over-cap", () => {
    expect(pickName(25)).toBe("Starter");
    expect(pickName(250)).toBe("Starter");
    expect(pickName(251)).toBe("Growth");
    expect(pickName(1000)).toBe("Growth");
    expect(pickName(1001)).toBe("Scale");
    expect(pickName(2500)).toBe("Scale");
    expect(pickName(2501)).toBe(OVER_CAP);
    expect(pickName(5000)).toBe(OVER_CAP);
  });
});

describe("computeRoi", () => {
  it("computes the defaults (250 seats, 36.70 EUR, 8 percent) in exact cents", () => {
    const r = computeRoi(250, 3670, 8);
    // 250 * 3670 = 917500 cents spend; 8% = 73400 cents
    expect(r.monthlyWasteCents).toBe(73400);
    expect(r.annualWasteCents).toBe(880800);
    expect(r.plan).toEqual({ name: "Starter", priceEur: 79, maxSeats: 250 });
    expect(r.paysOff).toBe(true);
  });

  it("marks seat counts above the largest tier as over-cap but keeps the waste math", () => {
    const r = computeRoi(3000, 3670, 8);
    // 3000 * 3670 = 11010000 cents spend; 8% = 880800 cents
    expect(r.monthlyWasteCents).toBe(880800);
    expect(r.annualWasteCents).toBe(880800 * 12);
    // /pricing routes >2.500 seats to talk-to-us, so no plan is quoted.
    expect(r.plan).toBe(OVER_CAP);
    expect(r.paysOff).toBe(false);
    expect(r.breakEvenSeats).toBe(27);
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
    // 10 EUR/seat at 2%: Starter would need 395 seats (> 250 cap),
    // Growth needs exactly 995 (within its 1.000 cap).
    expect(breakEvenSeats(1000, 2)).toBe(995);
    const atBreakEven = computeRoi(995, 1000, 2);
    expect(atBreakEven.plan).toEqual({
      name: "Growth",
      priceEur: 199,
      maxSeats: 1000,
    });
    expect(atBreakEven.paysOff).toBe(true);
    expect(computeRoi(994, 1000, 2).paysOff).toBe(false);
  });

  it("returns null when the break-even lies above the largest published tier", () => {
    // 10 EUR/seat at 1%: Starter would need 790 seats, Growth 1990,
    // Scale 4990, each above its cap, so no published plan breaks even.
    expect(breakEvenSeats(1000, 1)).toBeNull();
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
