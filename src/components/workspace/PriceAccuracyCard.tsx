"use client";

import { useTranslations } from "next-intl";

import { ButtonLink, Card } from "~/components/ui";
import type { PriceCoverage } from "~/lib/priceCoverage";

/**
 * Price-book confidence nudge that remains visible until every relevant product
 * has a contract price; partial configuration must never look exact.
 */
export const PriceAccuracyCard = ({
  coverage,
}: {
  coverage: PriceCoverage;
}) => {
  const t = useTranslations("licenses");
  return (
    <Card title={t("priceAccuracy.title")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-ink text-sm font-medium">
            {t("priceAccuracy.summary", {
              customProducts: coverage.customProducts,
              totalProducts: coverage.totalProducts,
            })}
          </p>
          <p className="text-ink-soft mt-1 text-sm">
            {t("priceAccuracy.spendCovered", {
              spendPercent: coverage.spendPercent,
            })}
            {coverage.estimateProducts > 0
              ? t("priceAccuracy.useListEstimates", {
                  count: coverage.estimateProducts,
                })
              : ""}
            {coverage.unpricedProducts > 0
              ? t("priceAccuracy.areUnpriced", {
                  count: coverage.unpricedProducts,
                })
              : ""}
            .
          </p>
          <div
            className="bg-line mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full"
            role="progressbar"
            aria-label={t("priceAccuracy.coverageAriaLabel")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={coverage.spendPercent}
          >
            <div
              className="bg-brand h-full rounded-full"
              style={{ width: `${coverage.spendPercent}%` }}
            />
          </div>
        </div>
        <ButtonLink href="/app/licenses">
          {t("priceAccuracy.setYourPrices")}
        </ButtonLink>
      </div>
    </Card>
  );
};
