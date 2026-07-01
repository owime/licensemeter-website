/**
 * Pure math behind the landing-page ROI calculator. Deliberately React-free
 * so roiMath.test.ts can pin the cents arithmetic, the plan-pick boundaries
 * and the break-even logic; the component only formats what this returns.
 * All money is integer cents, no float euros anywhere.
 */
import { DEMO_FIGURES } from "~/lib/demoFigures";

/** Mirrors the tiers on /pricing - keep both in sync. maxSeats is the pick boundary. */
export const PLAN_TIERS = [
  { name: "Starter", priceEur: 79, maxSeats: 250 },
  { name: "Growth", priceEur: 199, maxSeats: 1000 },
  { name: "Scale", priceEur: 499, maxSeats: 2500 },
] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

/**
 * Marker for seat counts above the largest published tier: /pricing routes
 * those tenants to talk-to-us, so the calculator must never quote Scale there.
 */
export const OVER_CAP = "over-cap";

export type PlanPick = PlanTier | typeof OVER_CAP;

/**
 * Waste share of the demo tenant, recomputed from the tested demo figures so
 * the slider hint can never drift from what the live demo actually shows.
 */
export const DEMO_WASTE_PCT = Math.round(
  (DEMO_FIGURES.monthlyWasteCents / DEMO_FIGURES.monthlySpendCents) * 100,
);

/** <=250 Starter, <=1000 Growth, <=2500 Scale, above that OVER_CAP. */
export const pickPlan = (seats: number): PlanPick =>
  PLAN_TIERS.find((tier) => seats <= tier.maxSeats) ?? OVER_CAP;

/** "36,70" or "36.70" → 3670 cents; anything unparseable or negative → 0. */
export const parseEuroToCents = (raw: string): number => {
  const value = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
};

/** Whole seats only; unparseable or negative → 0, absurd input capped. */
export const parseSeats = (raw: string): number => {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, 1_000_000);
};

/**
 * Smallest seat count at which the assumed waste covers the plan that
 * applies AT that size (tiers checked cheapest-first, so a break-even that
 * overshoots a tier's seat cap falls through to the next plan). Integer
 * ceiling division keeps exact boundaries exact. Null when the assumption
 * yields no waste at all (zero cost per seat) or when the break-even lies
 * above the largest published tier.
 */
export const breakEvenSeats = (
  costPerSeatCents: number,
  wastePct: number,
): number | null => {
  const wastePerHundredSeatsCents = costPerSeatCents * wastePct;
  if (wastePerHundredSeatsCents <= 0) return null;
  for (const tier of PLAN_TIERS) {
    const planPriceTimes100 = tier.priceEur * 100 * 100;
    const seats =
      Math.floor(planPriceTimes100 / wastePerHundredSeatsCents) +
      (planPriceTimes100 % wastePerHundredSeatsCents === 0 ? 0 : 1);
    if (seats <= tier.maxSeats) return seats;
  }
  return null;
};

export type RoiResult = {
  monthlyWasteCents: number;
  annualWasteCents: number;
  /** The published plan at this seat count, or OVER_CAP above the largest tier. */
  plan: PlanPick;
  /** Whether the assumed monthly waste covers the picked plan's price. */
  paysOff: boolean;
  /** See breakEvenSeats. */
  breakEvenSeats: number | null;
};

export const computeRoi = (
  seats: number,
  costPerSeatCents: number,
  wastePct: number,
): RoiResult => {
  const monthlyWasteCents = Math.round(
    (seats * costPerSeatCents * wastePct) / 100,
  );
  const plan = pickPlan(seats);
  return {
    monthlyWasteCents,
    annualWasteCents: monthlyWasteCents * 12,
    plan,
    paysOff: plan !== OVER_CAP && monthlyWasteCents >= plan.priceEur * 100,
    breakEvenSeats: breakEvenSeats(costPerSeatCents, wastePct),
  };
};
