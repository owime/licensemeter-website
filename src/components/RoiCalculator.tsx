"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { demoEuros } from "~/lib/demoFigures";
import {
  computeRoi,
  DEMO_WASTE_PCT,
  parseEuroToCents,
  parseSeats,
} from "~/components/roiMath";

const inputClass =
  "tnum mt-1.5 block min-h-11 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none";

/**
 * Interactive waste estimate for the landing page. Every number on screen is
 * the visitor's own assumption: we assert nothing; the math (integer cents) lives in roiMath.ts where it is unit-tested.
 */
export const RoiCalculator = () => {
  const t = useTranslations("roi.calculator");
  const seatsId = useId();
  const seatsHintId = useId();
  const costId = useId();
  const costHintId = useId();
  const shareId = useId();
  const shareHintId = useId();

  const [seatsRaw, setSeatsRaw] = useState("250");
  const [costRaw, setCostRaw] = useState("36.70");
  const [wastePct, setWastePct] = useState(8);

  const seats = parseSeats(seatsRaw);
  const costPerSeatCents = parseEuroToCents(costRaw);
  const result = computeRoi(seats, costPerSeatCents, wastePct);

  return (
    <div className="border-line bg-card shadow-card overflow-hidden rounded-2xl border">
      <div className="border-line flex items-baseline justify-between gap-3 border-b px-6 py-4">
        <span className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("badge")}
        </span>
        <span className="text-ink-faint font-mono text-xs whitespace-nowrap">
          {t("noDataLeaves")}
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_1.15fr]">
        <div className="border-line flex flex-col gap-5 border-b px-6 py-6 md:border-r md:border-b-0">
          <div>
            <label htmlFor={seatsId} className="text-sm font-medium">
              {t("seatsLabel")}
            </label>
            <input
              id={seatsId}
              type="number"
              inputMode="numeric"
              name="paidSeats"
              autoComplete="off"
              min={25}
              max={5000}
              step={1}
              value={seatsRaw}
              onChange={(e) => setSeatsRaw(e.currentTarget.value)}
              aria-describedby={seatsHintId}
              className={inputClass}
            />
            <p id={seatsHintId} className="text-ink-faint mt-1.5 text-xs">
              {t("seatsHint")}
            </p>
          </div>

          <div>
            <label htmlFor={costId} className="text-sm font-medium">
              {t("costLabel")}
            </label>
            <input
              id={costId}
              type="number"
              inputMode="decimal"
              name="monthlyCostPerSeatEur"
              autoComplete="off"
              min={0}
              step={0.01}
              value={costRaw}
              onChange={(e) => setCostRaw(e.currentTarget.value)}
              aria-describedby={costHintId}
              className={inputClass}
            />
            <p id={costHintId} className="text-ink-faint mt-1.5 text-xs">
              {t("costHint")}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={shareId} className="text-sm font-medium">
                {t("shareLabel")}
              </label>
              <span className="tnum font-mono text-sm whitespace-nowrap">
                {wastePct} %
              </span>
            </div>
            <input
              id={shareId}
              type="range"
              name="assumedWasteShare"
              min={1}
              max={25}
              step={1}
              value={wastePct}
              onChange={(e) => setWastePct(Number(e.currentTarget.value))}
              aria-describedby={shareHintId}
              aria-valuetext={t("shareValueAria", { value: wastePct })}
              className="accent-brand mt-1.5 block min-h-11 w-full cursor-pointer"
            />
            <p
              id={shareHintId}
              className="text-ink-faint mt-1 text-xs leading-relaxed"
            >
              {t("shareHint", { demoWastePct: DEMO_WASTE_PCT })}
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div aria-live="polite" aria-atomic="true">
            <div className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
              {t("resultBadge")}
            </div>
            <div className="font-display text-waste-text mt-3 text-5xl tracking-tight">
              € {demoEuros(result.monthlyWasteCents)}
            </div>
            <div className="text-ink-soft mt-1 text-sm">
              {t("resultCaption", {
                annual: `€ ${demoEuros(result.annualWasteCents)}`,
              })}
            </div>
            <p className="border-line text-ink-soft mt-5 border-t pt-4 text-sm leading-relaxed">
              {t("resultNote")}
            </p>
          </div>
          <Link
            href="/#get-started"
            className="text-brand-text mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:opacity-80"
          >
            {t("runScan")}
          </Link>
        </div>
      </div>
    </div>
  );
};
