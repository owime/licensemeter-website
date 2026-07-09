import { describe, expect, it } from "vitest";

import { calculatePriceCoverage } from "./priceCoverage";

describe("calculatePriceCoverage", () => {
  it("keeps partial workspaces visibly incomplete", () => {
    expect(
      calculatePriceCoverage([
        { seats: 10, priceCents: 1000, source: "custom" },
        { seats: 5, priceCents: 2000, source: "default" },
        { seats: 3, priceCents: 0, source: "default" },
      ]),
    ).toMatchObject({
      totalProducts: 3,
      customProducts: 1,
      estimateProducts: 1,
      unpricedProducts: 1,
      productPercent: 33,
      spendPercent: 50,
      complete: false,
    });
  });

  it("treats an empty workspace as complete", () => {
    expect(calculatePriceCoverage([])).toMatchObject({
      productPercent: 100,
      spendPercent: 100,
      complete: true,
    });
  });
});
