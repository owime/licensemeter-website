import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  Check,
  Code2,
  Download,
  FileCheck2,
  Receipt,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";
import { FeatureShowcase } from "~/components/landing/FeatureShowcase";
import { HeroVisual } from "~/components/landing/HeroVisual";
import { Reveal } from "~/components/landing/Reveal";
import { buttonClass } from "~/components/ui";
import { DEMO_FIGURES } from "~/lib/demoFigures";
import { SITE_DEFINITION, SITE_DESCRIPTION, SITE_TITLE } from "~/lib/site";

/* Plain-text names by design: referencing compatibility is nominative use;
 * official logos would need each vendor's permission (see footer notice). */
const CONNECTORS = [
  "Microsoft 365",
  "Adobe",
  "Zoom",
  "Atlassian",
  "Salesforce",
  "OpenAI",
  "Anthropic",
  "ChatGPT",
  "Claude",
] as const;

const VALUE_CARDS = [
  {
    Icon: Calculator,
    title: "Every seat, priced",
    body: "Each wasted seat carries a euro-per-month figure, summed to one recoverable total. Not a vanity score.",
  },
  {
    Icon: Receipt,
    title: "Evidence, per seat",
    body: "Who owns it, which app, why it's waste, and since when. Proof procurement and IT can both act on.",
  },
  {
    Icon: Download,
    title: "Reclaim, don't just report",
    body: "Export a finance CSV or a ready-to-run PowerShell script to remove the seats you choose.",
  },
] as const;

const HERO_TRUST = [
  "Read-only consent, exact scopes shown up front",
  "Never reads mailbox, files or content",
  "EU data residency (Frankfurt)",
  "Disconnect deletes everything",
] as const;

const PROOF = [
  {
    Icon: FileCheck2,
    title: "Browse the worked example",
    body: `Every figure is recomputed from the same tested, ${DEMO_FIGURES.users}-user synthetic tenant used by the live demo. No customer-data theatre.`,
    href: "/sample-report",
    cta: "Inspect the sample report →",
  },
  {
    Icon: Code2,
    title: "Audit the local scanner",
    body: "Run the Microsoft 365 scan locally and inspect the source. No account, no upload, and nothing leaves your tenant.",
    href: "https://github.com/ugurkocde/licensemeter",
    cta: "Review it on GitHub →",
  },
  {
    Icon: ShieldCheck,
    title: "Review the security model",
    body: "Check the exact Graph scopes, subprocessors, Frankfurt residency, retention, and deletion behavior before granting consent.",
    href: "/trust-center",
    cta: "Open the Trust Center →",
  },
] as const;

const BASE = siteUrl();

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    siteName: "LicenseMeter",
    url: BASE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ugurkocde",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

/* Page-level JSON-LD describes the free application. */
const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE}/#software`,
      name: "LicenseMeter",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: BASE,
      description: SITE_DEFINITION,
      publisher: { "@id": `${BASE}/#organization` },
      isAccessibleForFree: true,
    },
  ],
};

/* Fully static marketing page; daily revalidation is a safe default that keeps
 * it CDN-cacheable while letting content edits propagate within a day. */
export const revalidate = 86400;

export default async function LandingPage() {
  const signInOk = signInEnabled();
  const signInHref = signInPath();
  const demoEnabled = isDemoMode();

  return (
    <main>
      {/* 1 — Hero */}
      <section id="get-started" className="relative overflow-hidden">
        <div className="brand-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-14 lg:pt-16 lg:pb-20">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="rise rise-1">
              <p className="text-brand-text text-xs font-medium tracking-[0.12em] uppercase">
                Microsoft 365 + SaaS license optimization
              </p>
              <h1 className="font-display mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl xl:text-[4rem]">
                You&rsquo;re paying for SaaS licenses nobody uses.
              </h1>
              <p className="text-ink-soft mt-5 max-w-xl text-base leading-relaxed lg:text-lg">
                Microsoft 365, Adobe, Atlassian and your AI tools quietly bill
                for seats that left, sit idle, or were never opened.
                LicenseMeter checks every seat against your directory and shows
                the waste{" "}
                <span className="text-brand-text font-semibold">
                  in euros, in one view.
                </span>
              </p>
              <div className="mt-8">
                <SignInButtons
                  signInEnabled={signInOk}
                  signInHref={signInHref}
                  demoEnabled={demoEnabled}
                  showNote={false}
                  primaryLabel="Run my free scan"
                />
                <p className="text-ink-faint mt-3 text-xs">
                  Free scans and continuous monitoring. No credit card,
                  read-only access.
                </p>
              </div>
            </div>

            <div id="sample-tenant" className="rise rise-3 scroll-mt-8">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Works with */}
      <section className="border-line bg-subtle border-y">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:py-12">
          <ul className="text-ink-soft flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            {HERO_TRUST.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="text-good size-4 shrink-0" />
                {item}
              </li>
            ))}
            <li>
              <Link
                href="/security"
                className="text-brand-text font-medium underline underline-offset-4 hover:opacity-80"
              >
                Security overview →
              </Link>
            </li>
          </ul>
          <div className="border-line mt-8 border-t pt-8">
            <p className="text-ink-faint text-center text-sm">
              Works with the tools your seats live in
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CONNECTORS.map((name) => (
                <span
                  key={name}
                  className="border-line bg-card text-ink-soft rounded-full border px-3 py-1.5 text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
              <Link
                href="/connectors"
                className="text-brand-text inline-flex min-h-11 items-center font-medium underline underline-offset-4 hover:opacity-80"
              >
                See all connectors →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Inspectable product evidence, deliberately not presented as customer proof. */}
      <section className="border-line bg-card border-b">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-brand-text text-xs font-medium tracking-[0.12em] uppercase">
              Proof, not promises
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
              Inspect the product before you connect a tenant.
            </h2>
            <p className="text-ink-soft mt-3 leading-relaxed">
              There are no invented testimonials here. Start with the tested
              demo data, readable source code, and the same security documents
              your identity team will review.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {PROOF.map((item) => (
              <article
                key={item.title}
                className="border-line bg-canvas rounded-2xl border p-6"
              >
                <span className="bg-brand-soft text-brand-text inline-flex size-11 items-center justify-center rounded-xl">
                  <item.Icon
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-ink-soft mt-2 text-sm leading-relaxed">
                  {item.body}
                </p>
                {item.href.startsWith("/") ? (
                  <Link
                    href={item.href}
                    className="text-brand-text mt-4 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 hover:opacity-80"
                  >
                    {item.cta}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-text mt-4 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 hover:opacity-80"
                  >
                    {item.cta}
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Product tour */}
      <section
        id="product-tour"
        className="mx-auto max-w-6xl px-6 py-16 lg:py-24"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
            See it in action.
          </h2>
        </div>
        <div className="mt-10">
          <FeatureShowcase />
        </div>
      </section>

      {/* 3 — Value cards */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
            A bill you can actually cut.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUE_CARDS.map((card, index) => (
            <Reveal key={card.title} delay={index * 80}>
              <article className="border-line bg-card shadow-card hover:shadow-float h-full rounded-2xl border p-6 transition-shadow duration-200">
                <span className="bg-brand-soft text-brand-text ring-brand/10 inline-flex size-12 items-center justify-center rounded-2xl ring-1">
                  <card.Icon className="size-6" strokeWidth={1.75} />
                </span>
                <h3 className="font-display mt-4 text-xl font-semibold tracking-tight">
                  {card.title}
                </h3>
                <p className="text-ink-soft mt-2 text-sm leading-relaxed">
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-6 py-16 lg:py-24"
        aria-label="Open-source PowerShell module"
      >
        <div className="border-line bg-card mt-6 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="bg-ink-panel text-canvas inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Terminal className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-display text-base font-semibold tracking-tight">
                Prefer to run it yourself? It&rsquo;s free and open source.
              </p>
              <p className="text-ink-soft mt-1 text-sm leading-relaxed">
                LicenseMeter Scan is a free PowerShell module that scans the
                Microsoft 365 part locally and writes a self-contained HTML
                report. No account, nothing leaves your tenant. Connectors,
                history and alerts are also available in the free hosted app.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/ugurkocde/licensemeter"
            target="_blank"
            rel="noreferrer"
            className={buttonClass("secondary", "shrink-0")}
          >
            Get it on GitHub →
          </a>
        </div>
      </section>

      {/* Founder trust strip: the last thing read before the consent ask. */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <Reveal>
          <p className="text-ink-soft mx-auto max-w-2xl text-center text-sm leading-relaxed">
            LicenseMeter is built and maintained by{" "}
            <a
              href="https://ugurkoc.de"
              target="_blank"
              rel="noreferrer"
              className="text-brand-text font-medium underline underline-offset-4 hover:opacity-80"
            >
              Ugur Koc
            </a>
            , Microsoft MVP for Intune and Security Copilot, and operated by
            UgurLabs UG (haftungsbeschränkt), a German company in Düsseldorf.
          </p>
        </Reveal>
      </section>

      {/* Final CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="brand-radial border-line bg-brand-soft relative overflow-hidden rounded-3xl border px-6 py-10 sm:px-10">
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                See the number before your next renewal call.
              </h2>
              <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
                Every month it runs, the waste keeps billing. The scan is free
                and takes minutes. Pay only if you keep monitoring.
              </p>
            </div>
            <div className="lg:max-w-md lg:shrink-0">
              <SignInButtons
                signInEnabled={signInOk}
                signInHref={signInHref}
                demoEnabled={demoEnabled}
                showNote={false}
                primaryLabel="Run my free scan"
              />
              <p className="text-ink-faint mt-3 text-xs">
                Free to use, with no time limit. No credit card, read-only
                access.
              </p>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HOME_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
