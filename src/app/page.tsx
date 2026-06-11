import Link from "next/link";

import { env, isDemoMode } from "~/env";
import { auth } from "~/server/auth";
import { SignInButtons } from "~/components/SignInButtons";

const SAMPLE_LINES = [
  { label: "Disabled accounts still licensed", value: "412,90", unit: "/mo" },
  { label: "Copilot seats never opened", value: "393,40", unit: "/mo" },
  { label: "Unassigned paid seats", value: "587,20", unit: "/mo" },
  { label: "Inactive for 90+ days", value: "440,40", unit: "/mo" },
] as const;

export default async function LandingPage() {
  const session = await auth();
  const entraConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="font-display text-xl tracking-tight">
          License<span className="text-rust">Meter</span>
        </div>
        {session?.user ? (
          <Link
            href="/app"
            className="border border-line-strong bg-card px-4 py-2 text-sm font-medium hover:border-ink"
          >
            Open dashboard
          </Link>
        ) : (
          <span className="text-xs tracking-widest text-ink-faint uppercase">
            License waste analytics
          </span>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 pt-16 pb-24 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div className="rise rise-1">
          <p className="mb-6 text-xs font-medium tracking-[0.2em] text-rust uppercase">
            For IT and finance teams on Microsoft 365
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl">
            Find the licenses you pay for but nobody uses.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            LicenseMeter connects to your tenant read-only and puts a monthly
            price on every wasted seat: disabled accounts that still hold
            licenses, Copilot nobody opened, shelfware you renew out of habit.
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
          </ul>
        </div>

        <aside className="rise rise-3 self-start border border-line bg-card shadow-[0_1px_0_var(--color-line)]">
          <div className="flex items-baseline justify-between border-b border-line px-6 py-4">
            <span className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              Waste ledger — June
            </span>
            <span className="font-mono text-xs text-ink-faint">D90 window</span>
          </div>
          <div className="px-6 py-5">
            <div className="font-display text-5xl tracking-tight text-rust">
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
                className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-3 last:border-b-0"
              >
                <span className="text-sm text-ink-soft">{line.label}</span>
                <span className="tnum font-mono text-sm text-ink">
                  € {line.value}
                  <span className="text-ink-faint">{line.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
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
              <div className="font-mono text-xs text-rust">{step.n}</div>
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

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 text-xs text-ink-faint">
        <span>LicenseMeter</span>
        <span>Independent tool. Not affiliated with Microsoft.</span>
      </footer>
    </main>
  );
}
