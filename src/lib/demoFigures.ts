/**
 * Figures of the deterministic demo tenant ("Meridian Industries GmbH"),
 * the single worked example quoted across the marketing pages. The landing
 * ledger card and sample report both render from these constants so
 * the pages can never contradict each other; demoFigures.test.ts
 * recomputes every value from the demo fixtures and the rules engine, so the
 * marketing numbers cannot silently drift from what the live demo shows.
 */
export const DEMO_FIGURES = {
  orgName: "Meridian Industries GmbH",
  users: 155,
  /** Sum of monthlyImpactCents over all findings of the demo tenant. */
  monthlyWasteCents: 297986,
  /** Monthly Microsoft 365 spend: assigned seats times default list price. */
  monthlySpendCents: 697990,
  findingsCount: 65,
  /** Disabled accounts still holding Microsoft 365 licenses. */
  leaverCount: 8,
  /** Of those, people also holding Adobe, Zoom, Atlassian, Salesforce, AI console or AI seat access. */
  crossVendorLeaverCount: 7,
  /** Waste grouped for the landing ledger card; sums to monthlyWasteCents. */
  byCategory: {
    /** Disabled in Entra but still licensed: M365 and connected apps. */
    leavers: 78669,
    /** Connected-app seats with no directory account at all. */
    orphaned: 4599,
    /** Inactive 90+ days or never active: M365 and connected apps. */
    idle: 75158,
    copilotUnused: 39340,
    shelfware: 89210,
    guests: 11010,
  },
} as const;

/** "2.844,86": the German number convention used across the marketing copy. */
export const demoEuros = (cents: number): string =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

/** Annualized waste rounded to the nearest thousand, formatted ("34.000"). */
export const DEMO_ANNUAL_WASTE_ROUNDED = new Intl.NumberFormat("de-DE").format(
  Math.round((DEMO_FIGURES.monthlyWasteCents * 12) / 100_000) * 1000,
);
