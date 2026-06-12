import Link from "next/link";

import { env, isDemoMode } from "~/env";
import { EmailCapture } from "~/components/EmailCapture";
import { RoiCalculator } from "~/components/RoiCalculator";
import { SignInButtons } from "~/components/SignInButtons";
import { Pill, type PillTone } from "~/components/ui";
import {
  DEMO_ANNUAL_WASTE_ROUNDED,
  DEMO_FIGURES,
  demoEuros,
} from "~/lib/demoFigures";
import { ALL_RULES } from "~/lib/rules";
import { SITE_DEFINITION } from "~/lib/site";
import { getScanStats } from "~/server/marketingStats";

/** "12,4": German decimal convention, matching the euro figures around it. */
const fmtPct = (n: number): string =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(n);

/* Plain-text names by design: referencing compatibility is nominative use;
 * official logos would need each vendor's permission (see footer notice). */
const CONNECTOR_STRIP: Array<{
  name: string;
  href: string;
  blurb: string;
  tag?: string;
  tone?: PillTone;
}> = [
  {
    name: "Microsoft 365",
    tag: "Core",
    tone: "moss",
    href: "/security",
    blurb:
      "The full scan: licenses, sign-in activity and usage reports.",
  },
  {
    name: "Adobe",
    href: "/connectors/adobe",
    blurb: "Creative Cloud seats held by people who are disabled or gone.",
  },
  {
    name: "Zoom",
    href: "/connectors/zoom",
    blurb: "Licensed seats nobody has opened since Teams took over.",
  },
  {
    name: "Atlassian",
    href: "/connectors/atlassian",
    blurb: "Jira and Confluence seats that outlived their users.",
  },
  {
    name: "Salesforce",
    href: "/connectors/salesforce",
    blurb: "CRM licenses, the most expensive seats to forget.",
  },
  {
    name: "OpenAI",
    href: "/connectors/openai",
    blurb: "API spend by day, plus departed people still on the console.",
  },
  {
    name: "Anthropic",
    href: "/connectors/anthropic",
    blurb: "Claude API costs tracked daily, console access cross-checked.",
  },
  {
    name: "ChatGPT",
    href: "/connectors/chatgpt",
    blurb: "Enterprise seats matched against your directory via CSV import.",
  },
  {
    name: "Claude",
    href: "/connectors/claude",
    blurb: "Team and Enterprise seats that outlived their users.",
  },
];

/* Ledger lines render from the tested demo figures and sum exactly to the
 * headline: the card is a preview of the live demo tenant, not a mockup. */
const LEDGER_LINES = [
  { label: "Left the company, still licensed", cents: DEMO_FIGURES.byCategory.leavers },
  { label: "App seats with no directory account", cents: DEMO_FIGURES.byCategory.orphaned },
  { label: "Inactive 90+ days or never used", cents: DEMO_FIGURES.byCategory.idle },
  { label: "Copilot seats never opened", cents: DEMO_FIGURES.byCategory.copilotUnused },
  { label: "Unassigned paid seats", cents: DEMO_FIGURES.byCategory.shelfware },
  { label: "Licensed guest accounts", cents: DEMO_FIGURES.byCategory.guests },
] as const;

const TRUST_ITEMS = [
  "Read-only Graph permissions",
  "No mailbox or file content",
  "EU data residency",
  "Disconnect deletes everything",
] as const;

const STEPS = [
  {
    n: "01",
    title: "Consent once",
    body: "A Global Admin grants read-only application permissions. No agent, no write access, five minutes.",
  },
  {
    n: "02",
    title: "Synced nightly",
    body: "Directory, license assignments, sign-in activity and usage reports, joined into one waste analysis. Every connected app's seat list is checked against who still works there.",
  },
  {
    n: "03",
    title: "Reclaim with proof",
    body: "Every finding carries its monthly cost, a CSV for finance and a generated PowerShell script for IT.",
  },
] as const;

// Mirrors the tiers on /pricing - keep both in sync.
const PRICING_TEASER = [
  { name: "Starter", price: "79", seats: "up to 250 seats" },
  { name: "Growth", price: "199", seats: "up to 1.000 seats" },
  { name: "Scale", price: "499", seats: "up to 2.500 seats" },
] as const;

/* Trailing separator so a wrapped line never starts with a stray slash. */
const trustItemClass =
  "after:mx-6 after:text-line-strong after:content-['/'] last:after:content-none";

/* Static with daily revalidation: the only time-sensitive content is the
 * current month in the ledger-card header, and up to a day of staleness at a
 * month rollover is acceptable. Keeps the page CDN-cacheable for visitors and
 * crawlers alike. */
export const revalidate = 86400;

export default async function LandingPage() {
  const entraConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);
  const demoEnabled = isDemoMode();
  const month = new Date().toLocaleString("en-US", { month: "long" });
  /* Build/ISR-time aggregate; null (renders nothing) until the numbers are
   * worth quoting. Reads the db without any request-bound API, so the route
   * stays fully static. */
  const stats = await getScanStats();

  return (
    <main>
      <section
        id="get-started"
        className="mx-auto grid max-w-6xl gap-14 px-6 pt-12 pb-24 lg:grid-cols-[1.35fr_1fr] lg:gap-12"
      >
        <div className="rise rise-1">
          <p className="mb-6 text-xs font-medium tracking-[0.2em] text-rust-text uppercase">
            For IT and finance teams on Microsoft 365
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-5xl xl:text-6xl">
            They left the company. Their licenses didn&rsquo;t.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            {/* Definition-shaped first sentence: what answer engines cite. */}
            {SITE_DEFINITION} Run a free, read-only scan and see your number:
            the account disabled in March that still holds a paid Salesforce
            seat, the Copilot nobody opened, the shelfware you renew out of
            habit.
          </p>
          <div className="mt-10">
            <SignInButtons
              entraConfigured={entraConfigured}
              demoEnabled={demoEnabled}
            />
          </div>
          <ul className="mt-10 flex flex-wrap gap-y-2 text-[13px] text-ink-soft">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className={trustItemClass}>
                {item}
              </li>
            ))}
            <li className={trustItemClass}>
              <Link
                href="/security"
                className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
              >
                Read the security overview
              </Link>
            </li>
          </ul>
          {stats && (
            <p className="mt-4 text-[13px] text-ink-faint">
              Across {stats.tenants} connected tenants, an average of{" "}
              {fmtPct(stats.avgWastePct)} percent of license spend is waste.
            </p>
          )}
        </div>

        <div className="rise rise-3 self-center border border-line bg-card shadow-[0_1px_0_var(--color-line)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-6 py-4">
            <span className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              Waste ledger · {month}
            </span>
            <span className="font-mono text-xs whitespace-nowrap text-ink-faint">
              Demo tenant · {DEMO_FIGURES.users} users
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="font-display text-5xl tracking-tight text-rust-text">
              € {demoEuros(DEMO_FIGURES.monthlyWasteCents)}
            </div>
            <div className="mt-1 text-sm text-ink-soft">
              recoverable every month · about € {DEMO_ANNUAL_WASTE_ROUNDED} a
              year
            </div>
          </div>
          <ul className="border-t border-line">
            {LEDGER_LINES.map((line) => (
              <li
                key={line.label}
                className="flex flex-col gap-0.5 border-b border-line px-6 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="text-sm text-ink-soft">{line.label}</span>
                <span className="tnum font-mono text-sm whitespace-nowrap text-ink">
                  € {demoEuros(line.cents)}
                  <span className="text-ink-faint">/mo</span>
                </span>
              </li>
            ))}
          </ul>
          {demoEnabled && (
            <form action="/api/auth/demo" method="post" className="border-t border-line">
              <button className="block w-full cursor-pointer px-6 py-3.5 text-left text-sm font-medium text-ink underline-offset-4 transition hover:text-rust-text hover:underline">
                Open this tenant in the live demo →
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-medium tracking-[0.2em] text-rust-text uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight text-balance">
            {/* Count computed from the engine so the copy cannot go stale. */}
            {ALL_RULES.length} waste rules, every finding priced in euros.
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <div className="font-mono text-xs text-rust-text">{step.n}</div>
                <h3 className="mt-3 font-display text-2xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-line pt-8">
            <h3 className="text-xs font-medium tracking-[0.2em] text-ink-faint uppercase">
              Connects to
            </h3>
            <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
              {CONNECTOR_STRIP.map((c) => (
                <Link key={c.name} href={c.href} className="group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium underline-offset-4 group-hover:underline">
                      {c.name}
                    </span>
                    {c.tag && c.tone ? <Pill tone={c.tone}>{c.tag}</Pill> : null}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    {c.blurb}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="border border-line bg-card">
          <div className="flex flex-col gap-4 px-6 pt-6 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="max-w-md">
              <h2 className="font-display text-2xl tracking-tight">
                Flat pricing, published.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Sized by seats, not by how much waste we find. See your number
                free, then decide.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 text-sm font-medium text-ink underline underline-offset-4 hover:text-rust-text"
            >
              See full pricing →
            </Link>
          </div>
          <div className="mt-6 grid border-t border-line sm:grid-cols-3">
            {PRICING_TEASER.map((tier, i) => (
              <div
                key={tier.name}
                className={`px-6 py-4 ${
                  i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""
                }`}
              >
                <div className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
                  {tier.name}
                </div>
                <div className="mt-1 font-display text-2xl tracking-tight">
                  € {tier.price}
                  <span className="font-sans text-xs text-ink-soft">
                    {" "}
                    / month
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">{tier.seats}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          What does your tenant leak?
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
          Your assumptions, your math. The scan replaces guesses with your
          actual number.
        </p>
        <div className="mt-8">
          <RoiCalculator />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="border border-line bg-card px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <h2 className="font-display text-2xl tracking-tight text-balance">
                Not ready to connect a tenant yet?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Leave your email and the security one-pager plus a
                getting-started guide for your first scan land in your inbox
                right away, and one note at general availability. Unsubscribe
                any time.
              </p>
            </div>
            <div className="w-full sm:max-w-sm">
              <EmailCapture />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="flex flex-col gap-6 border border-line bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl tracking-tight">
              Built by Ugur Koc
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              I am a Microsoft MVP for Intune and Security Copilot, and I build{" "}
              <a
                href="https://github.com/ugurkocde"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
              >
                open-source tools for Microsoft 365 admins
              </a>{" "}
              (IntuneAssignmentChecker, IntuneBrew, DeviceOffboardingManager).
              LicenseMeter asks for read-only access to your tenant, so you
              should know exactly who is behind it. I answer support myself.
            </p>
          </div>
          <Link
            href="/security"
            className="shrink-0 text-sm font-medium text-ink underline underline-offset-4 hover:text-rust-text"
          >
            Security overview →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          See your waste number in two minutes.
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
          {demoEnabled
            ? "Start on the live demo tenant, no account needed. When you are ready, run the same read-only scan on your own."
            : "Connect read-only and see the monthly cost of every wasted seat before you decide anything."}
        </p>
        <div className="mt-8">
          <SignInButtons
            entraConfigured={entraConfigured}
            demoEnabled={demoEnabled}
            showNote={false}
          />
        </div>
      </section>
    </main>
  );
}
