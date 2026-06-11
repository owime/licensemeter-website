import Link from "next/link";

import { env, isDemoMode } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";

const SAMPLE_LINES = [
  { label: "Disabled accounts still licensed", value: "412,90" },
  { label: "Copilot seats never opened", value: "393,40" },
  { label: "Unassigned paid seats", value: "587,20" },
  { label: "Inactive for 90+ days", value: "440,40" },
] as const;

export default function LandingPage() {
  const entraConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);

  return (
    <main>
      <section
        id="get-started"
        className="mx-auto grid max-w-6xl gap-14 px-6 pt-12 pb-24 lg:grid-cols-[1.2fr_1fr] lg:gap-10"
      >
        <div className="rise rise-1">
          <p className="mb-6 text-xs font-medium tracking-[0.2em] text-rust-text uppercase">
            For IT and finance teams on Microsoft 365
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl">
            Find the licenses you pay for but nobody uses.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            LicenseMeter runs a read-only waste scan on your tenant and puts a
            monthly price on every wasted seat: disabled accounts that still
            hold licenses, Copilot nobody opened, shelfware you renew out of
            habit.
          </p>
          <div className="mt-10">
            <SignInButtons
              entraConfigured={entraConfigured}
              demoEnabled={isDemoMode()}
            />
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
            <li>Read-only Graph permissions</li>
            <li aria-hidden="true" className="text-line-strong">/</li>
            <li>No mailbox or file content</li>
            <li aria-hidden="true" className="text-line-strong">/</li>
            <li>EU data residency</li>
            <li aria-hidden="true" className="text-line-strong">/</li>
            <li>Disconnect deletes everything</li>
            <li aria-hidden="true" className="text-line-strong">/</li>
            <li>
              <Link
                href="/security"
                className="font-medium text-ink underline underline-offset-4 hover:text-rust-text"
              >
                Read the security overview
              </Link>
            </li>
          </ul>
        </div>

        <div className="rise rise-3 self-start border border-line bg-card shadow-[0_1px_0_var(--color-line)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-6 py-4">
            <span className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              Waste ledger — June
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
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Consent once",
              body: "A Global Admin grants read-only application permissions. No agent, no write access, five minutes.",
            },
            {
              n: "02",
              title: "Synced nightly",
              body: "Directory, license assignments, sign-in activity and usage reports - joined into one waste analysis.",
            },
            {
              n: "03",
              title: "Reclaim with proof",
              body: "Every finding carries its monthly cost, a CSV for finance and a generated PowerShell script for IT.",
            },
          ].map((step) => (
            <div key={step.n}>
              <div className="font-mono text-xs text-rust-text">{step.n}</div>
              <h2 className="mt-3 font-display text-2xl tracking-tight">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-6 border border-line bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl tracking-tight">
              Built by Ugur Koc
            </h2>
            {/* TODO before launch: replace with the real one-line bio and add a photo. */}
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              [One line about your Microsoft 365 community work — MVP status,
              talks, open-source projects.] LicenseMeter asks for read-only
              access to your tenant, so you should know exactly who is behind
              it.
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
    </main>
  );
}
