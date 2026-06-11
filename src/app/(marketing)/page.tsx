import Link from "next/link";

import { env, isDemoMode } from "~/env";
import { EmailCapture } from "~/components/EmailCapture";
import { SignInButtons } from "~/components/SignInButtons";

const SAMPLE_LINES = [
  { label: "Disabled accounts still licensed", value: "412,90" },
  { label: "Copilot seats never opened", value: "393,40" },
  { label: "Unassigned paid seats", value: "587,20" },
  { label: "Inactive for 90+ days", value: "440,40" },
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
    body: "Directory, license assignments, sign-in activity and usage reports — joined into one waste analysis.",
  },
  {
    n: "03",
    title: "Reclaim with proof",
    body: "Every finding carries its monthly cost, a CSV for finance and a generated PowerShell script for IT.",
  },
] as const;

// Mirrors the tiers on /pricing — keep both in sync.
const PRICING_TEASER = [
  { name: "Starter", price: "79", seats: "up to 250 seats" },
  { name: "Growth", price: "199", seats: "up to 1,000 seats" },
  { name: "Scale", price: "499", seats: "up to 2,500 seats" },
] as const;

/* Trailing separator so a wrapped line never starts with a stray slash. */
const trustItemClass =
  "after:mx-6 after:text-line-strong after:content-['/'] last:after:content-none";

/* The ledger card shows the current month — keep rendering per-request even
 * if the marketing layout ever stops touching cookies. */
export const dynamic = "force-dynamic";

export default function LandingPage() {
  const entraConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);
  const demoEnabled = isDemoMode();
  const month = new Date().toLocaleString("en-US", { month: "long" });

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
            Find the licenses you pay for but nobody uses.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Run a free, read-only waste scan on your Microsoft 365 tenant and
            see the monthly price of every wasted seat: disabled accounts that
            still hold licenses, Copilot nobody opened, shelfware you renew out
            of habit.
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
        </div>

        <div className="rise rise-3 self-center border border-line bg-card shadow-[0_1px_0_var(--color-line)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-6 py-4">
            <span className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              Waste ledger — {month}
            </span>
            <span className="font-mono text-xs whitespace-nowrap text-ink-faint">
              Illustrative · D90
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="font-display text-5xl tracking-tight text-rust-text">
              € 1.833,90
            </div>
            <div className="mt-1 text-sm text-ink-soft">
              recoverable every month · € 22.006 a year
            </div>
          </div>
          <ul className="border-t border-line">
            {SAMPLE_LINES.map((line) => (
              <li
                key={line.label}
                className="flex flex-col gap-0.5 border-b border-line px-6 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="text-sm text-ink-soft">{line.label}</span>
                <span className="tnum font-mono text-sm whitespace-nowrap text-ink">
                  € {line.value}
                  <span className="text-ink-faint">/mo</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-medium tracking-[0.2em] text-rust-text uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight">
            Six waste rules, every finding priced in euros.
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            Microsoft 365 today — Adobe, Zoom, Atlassian and Salesforce
            connectors in beta.
          </p>
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
                  €{tier.price}
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
        <div className="border border-line bg-card px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <h2 className="font-display text-2xl tracking-tight">
                Not ready to connect a tenant yet?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Leave your email and you get the security one-pager for your
                IT team plus one note at general availability. A personal
                email, not a list.
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
              — IntuneAssignmentChecker, IntuneBrew, DeviceOffboardingManager.
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
        <h2 className="font-display text-3xl tracking-tight">
          See your waste number in two minutes.
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
          {demoEnabled
            ? "Start on the live demo tenant, no account needed. When you are ready, run the same read-only scan on your own."
            : "Connect read-only and see the monthly cost of every wasted seat — before you decide anything."}
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
