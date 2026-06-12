"use client";

import { useId, useState } from "react";

import { demoEuros } from "~/lib/demoFigures";
import {
  computeRoi,
  DEMO_WASTE_PCT,
  parseEuroToCents,
  parseSeats,
} from "~/components/roiMath";

/** "1.250": seat counts in the same German convention as the money. */
const fmtSeats = (n: number): string =>
  new Intl.NumberFormat("de-DE").format(n);

const inputClass =
  "tnum mt-1.5 block min-h-11 w-full border border-line bg-card px-3 py-2.5 text-sm focus:border-ink";

/**
 * Interactive waste estimate for the landing page. Every number on screen is
 * the visitor's own assumption: we assert nothing; the math (integer cents,
 * plan pick, break-even) lives in roiMath.ts where it is unit-tested.
 */
export const RoiCalculator = () => {
  const seatsId = useId();
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
    <div className="border border-line bg-card shadow-[0_1px_0_var(--color-line)]">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-6 py-4">
        <span className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
          Waste estimate · your assumptions
        </span>
        <span className="font-mono text-xs whitespace-nowrap text-ink-faint">
          No data leaves this page
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col gap-5 border-b border-line px-6 py-6 md:border-r md:border-b-0">
          <div>
            <label htmlFor={seatsId} className="text-sm font-medium">
              Paid seats
            </label>
            <input
              id={seatsId}
              type="number"
              inputMode="numeric"
              min={25}
              max={5000}
              step={1}
              value={seatsRaw}
              onChange={(e) => setSeatsRaw(e.currentTarget.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={costId} className="text-sm font-medium">
              Average monthly cost per seat (EUR)
            </label>
            <input
              id={costId}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={costRaw}
              onChange={(e) => setCostRaw(e.currentTarget.value)}
              aria-describedby={costHintId}
              className={inputClass}
            />
            <p id={costHintId} className="mt-1.5 text-xs text-ink-faint">
              Prefilled with the Microsoft 365 E3 list price.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={shareId} className="text-sm font-medium">
                Assumed waste share
              </label>
              <span className="tnum font-mono text-sm whitespace-nowrap">
                {wastePct} %
              </span>
            </div>
            <input
              id={shareId}
              type="range"
              min={1}
              max={25}
              step={1}
              value={wastePct}
              onChange={(e) => setWastePct(Number(e.currentTarget.value))}
              aria-describedby={shareHintId}
              className="mt-1.5 block min-h-11 w-full cursor-pointer accent-rust"
            />
            <p
              id={shareHintId}
              className="mt-1 text-xs leading-relaxed text-ink-faint"
            >
              Your assumption: the demo tenant runs at {DEMO_WASTE_PCT}{" "}
              percent, well-run tenants still leak single digits.
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div aria-live="polite" aria-atomic="true">
            <div className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              At your assumptions
            </div>
            <div className="mt-3 font-display text-5xl tracking-tight text-rust-text">
              € {demoEuros(result.monthlyWasteCents)}
            </div>
            <div className="mt-1 text-sm text-ink-soft">
              wasted every month · € {demoEuros(result.annualWasteCents)} a
              year
            </div>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
              {result.paysOff ? (
                <>
                  At {fmtSeats(seats)} seats that is the {result.plan.name}{" "}
                  plan at € {result.plan.priceEur}/month, paid back at a
                  fraction of this.
                </>
              ) : result.breakEvenSeats !== null ? (
                <>
                  At this assumption the subscription only pays off above{" "}
                  {fmtSeats(result.breakEvenSeats)} seats. Run the free scan
                  and use your real number.
                </>
              ) : (
                <>
                  Enter a cost per seat and the math runs against the
                  published plans.
                </>
              )}
            </p>
          </div>
          <a
            href="#get-started"
            className="mt-4 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-rust-text"
          >
            Run the free scan instead →
          </a>
        </div>
      </div>
    </div>
  );
};
