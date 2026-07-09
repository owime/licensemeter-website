"use client";

import { useState } from "react";

import { IntervalToggle } from "~/components/pricing/IntervalToggle";
import { buttonClass } from "~/components/ui";
import {
  PLANS,
  TRIAL_DAYS,
  annualPerMonth,
  planString,
  priceEurosFor,
} from "~/lib/plans";
import type { PlanInterval } from "~/server/types";

/** German thousands separators, whole euros, to match the rest of the site. */
const fmtEuros = (n: number): string =>
  new Intl.NumberFormat("de-DE").format(n);

export const PricingTiers = ({
  signInEnabled,
  signInHref,
}: {
  /** Whether sign-in is configured on this deployment. */
  signInEnabled: boolean;
  /** Sign-in entry path for the active provider (returnTo appended below). */
  signInHref: string;
}) => {
  const [interval, setInterval] = useState<PlanInterval>("month");

  return (
    <div>
      <div className="flex justify-center">
        <IntervalToggle
          interval={interval}
          onChange={setInterval}
          annualBadge="2 months free"
        />
      </div>

      <div className="border-line bg-line mt-8 grid gap-px border md:grid-cols-3">
        {PLANS.map((plan) => {
          const perMonth =
            interval === "year"
              ? annualPerMonth(plan)
              : priceEurosFor(plan.tier, "month");
          const annualTotal = priceEurosFor(plan.tier, "year");
          const ctaHref = signInEnabled
            ? `${signInHref}?returnTo=${encodeURIComponent(
                "/app/billing?plan=" + planString(plan.tier, interval),
              )}`
            : "/#get-started";
          return (
            <div
              key={plan.tier}
              className={`bg-card flex flex-col px-6 py-6 ${
                plan.featured
                  ? "outline-ink outline outline-2 -outline-offset-1"
                  : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
                  {plan.name}
                </h2>
                {plan.featured && (
                  <span className="bg-ink text-canvas px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
                    Most popular
                  </span>
                )}
              </div>
              <div className="font-display mt-4 text-4xl tracking-tight">
                € {fmtEuros(perMonth)}
                <span className="text-ink-soft font-sans text-sm">
                  {" "}
                  / month
                </span>
              </div>
              <div className="text-ink-soft mt-1 text-sm">{plan.seats}</div>
              {interval === "year" && (
                <div className="text-ink-faint mt-1 text-xs">
                  billed annually (€ {fmtEuros(annualTotal)}) · 2 months free
                </div>
              )}
              <div className="mt-6">
                <a
                  href={ctaHref}
                  className={buttonClass(
                    plan.featured ? "primary" : "secondary",
                    "w-full",
                  )}
                >
                  {signInEnabled
                    ? `Start ${TRIAL_DAYS}-day trial`
                    : "Start free"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
