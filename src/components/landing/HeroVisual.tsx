import type { CSSProperties } from "react";
import { Check } from "lucide-react";

import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";

/* Ledger lines render from the tested demo figures and sum to the headline.
 * The card is a synthetic sample tenant, not customer proof. Tones map to the
 * categorical meter ramp in globals.css. */
const LINES = [
  {
    label: "Left the company, still licensed",
    cents: DEMO_FIGURES.byCategory.leavers,
    tone: "meter-danger",
  },
  {
    label: "Inactive 90+ days or never used",
    cents: DEMO_FIGURES.byCategory.idle,
    tone: "meter-waste",
  },
  {
    label: "Unassigned paid seats",
    cents: DEMO_FIGURES.byCategory.shelfware,
    tone: "meter-slate",
  },
  {
    label: "Copilot seats never opened",
    cents: DEMO_FIGURES.byCategory.copilotUnused,
    tone: "meter-plum",
  },
  {
    label: "App seats with no directory account",
    cents: DEMO_FIGURES.byCategory.orphaned,
    tone: "meter-gold",
  },
  {
    label: "Licensed guest accounts",
    cents: DEMO_FIGURES.byCategory.guests,
    tone: "meter-teal",
  },
] as const;

const SCAN_STREAM = [
  "Directory status",
  "License assignments",
  "Sign-in activity",
  "Usage reports",
  "Connected app seats",
  "Daily AI spend",
] as const;

const FINAL_CENTS = DEMO_FIGURES.monthlyWasteCents;
const STEPS = LINES.length;

/**
 * The hero product visual: a self-contained, themed mockup of the waste ledger
 * a real scan produces. All meaningful text and totals stay stable from the
 * server render onward, protecting LCP and avoiding a final→zero→final hydration
 * flash. Only the decorative bars reveal with compositor-friendly CSS, and the
 * global reduced-motion rule disables that reveal when requested.
 */
export const HeroVisual = () => {
  return (
    <div className="border-line bg-card shadow-hero relative overflow-hidden rounded-3xl border">
      <div className="grid lg:grid-cols-[1fr_0.72fr]">
        <div className="px-4 py-5 sm:px-6">
          <div className="font-display waste-total tnum text-4xl tracking-tight whitespace-nowrap sm:text-5xl">
            −€ {demoEuros(FINAL_CENTS)}
            <span className="text-ink-faint text-base font-normal">/mo</span>
          </div>

          <ul className="mt-5 space-y-3">
            {LINES.map((line, index) => {
              const width = `${(line.cents / FINAL_CENTS) * 100}%`;
              return (
                <li key={line.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-ink-soft text-sm">{line.label}</span>
                    <span className="tnum min-w-[6.5rem] text-right font-mono text-sm whitespace-nowrap">
                      <span className="text-ink">
                        € {demoEuros(line.cents)}
                        <span className="text-ink-faint">/mo</span>
                      </span>
                    </span>
                  </div>
                  <div className="bg-line mt-2 h-1.5 overflow-hidden rounded-full">
                    <div
                      aria-hidden="true"
                      className={`${line.tone} meter-bar h-full rounded-full`}
                      style={
                        {
                          "--bar": width,
                          animationDelay: `${160 + index * 80}ms`,
                        } as CSSProperties
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside
          aria-label="Completed sample scan"
          className="border-line bg-ink-panel text-canvas hidden flex-col px-5 py-6 lg:flex lg:border-l"
        >
          <ol className="space-y-3">
            {SCAN_STREAM.map((item) => {
              return (
                <li
                  key={item}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-canvas/85">{item}</span>
                  <Check
                    className="text-good size-4 shrink-0"
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ol>

          <div className="mt-auto pt-6">
            <div className="bg-canvas/10 h-1 overflow-hidden rounded-full">
              <div
                aria-hidden="true"
                className="bg-brand-bright meter-bar h-full rounded-full"
                style={
                  {
                    "--bar": "100%",
                    animationDelay: `${160 + STEPS * 80}ms`,
                  } as CSSProperties
                }
              />
            </div>
            <p className="text-ink-soft-text mt-2.5 text-[11px] font-medium tracking-[0.12em] uppercase">
              Sample scan complete
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
