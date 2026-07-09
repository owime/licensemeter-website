export type PriceCoverageProduct = {
  priceCents: number;
  source: "default" | "custom" | undefined;
  seats: number;
};

export type PriceCoverage = {
  totalProducts: number;
  customProducts: number;
  estimateProducts: number;
  unpricedProducts: number;
  customSpendCents: number;
  totalSpendCents: number;
  productPercent: number;
  spendPercent: number;
  complete: boolean;
};

/** Contract-price coverage across products that can contribute spend. */
export const calculatePriceCoverage = (
  products: PriceCoverageProduct[],
): PriceCoverage => {
  const totalProducts = products.length;
  let customProducts = 0;
  let estimateProducts = 0;
  let unpricedProducts = 0;
  let customSpendCents = 0;
  let totalSpendCents = 0;

  for (const product of products) {
    const spend = product.seats * product.priceCents;
    totalSpendCents += spend;
    if (product.priceCents <= 0) unpricedProducts++;
    else if (product.source === "custom") {
      customProducts++;
      customSpendCents += spend;
    } else estimateProducts++;
  }

  return {
    totalProducts,
    customProducts,
    estimateProducts,
    unpricedProducts,
    customSpendCents,
    totalSpendCents,
    productPercent:
      totalProducts === 0
        ? 100
        : Math.round((customProducts / totalProducts) * 100),
    spendPercent:
      totalSpendCents === 0
        ? totalProducts === 0
          ? 100
          : 0
        : Math.round((customSpendCents / totalSpendCents) * 100),
    complete: totalProducts === 0 || customProducts === totalProducts,
  };
};
