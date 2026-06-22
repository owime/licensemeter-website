"use client";

import type { PlanInterval } from "~/server/types";

/**
 * Segmented monthly/annual control. Two buttons in a pill track; the active
 * segment uses the ink fill, matching the dark-on-light controls elsewhere.
 */
export const IntervalToggle = ({
  interval,
  onChange,
  annualBadge,
  className = "",
}: {
  interval: PlanInterval;
  onChange: (interval: PlanInterval) => void;
  /** Optional badge shown on the Annual segment, e.g. "2 months free". */
  annualBadge?: string;
  className?: string;
}) => {
  const options: { value: PlanInterval; label: string }[] = [
    { value: "month", label: "Monthly" },
    { value: "year", label: "Annual" },
  ];
  return (
    <div
      role="group"
      aria-label="Billing interval"
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-card p-1 ${className}`}
    >
      {options.map((option) => {
        const active = interval === option.value;
        const badge =
          option.value === "year" && annualBadge ? annualBadge : null;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
            {badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                  active
                    ? "bg-brand text-canvas"
                    : "bg-brand-soft text-brand-deep"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
