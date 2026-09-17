import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";
import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";

import { buildWasteExplainers } from "./content";

export const metadata: Metadata = {
  title: "Microsoft 365 license waste patterns",
  description:
    "The six ways Microsoft 365 tenants pay for seats nobody uses: disabled accounts still licensed, never-active users, inactive seats, unassigned licenses, idle Copilot seats and licensed guests. One explainer per pattern, with detection recipes.",
  alternates: { canonical: "/waste" },
};

const BASE = siteUrl();

/* Static breadcrumb; "<" escaped so nothing can terminate the script. */
const INDEX_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    {
      "@type": "ListItem",
      position: 2,
      name: "License waste patterns",
      item: `${BASE}/waste`,
    },
  ],
};

export default async function WasteIndexPage() {
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  const signInHref = signInPath();
  const t = await getTranslations("waste");
  const explainers = buildWasteExplainers(t);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        {t("index.eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {t("index.h1")}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("index.intro")}
      </p>

      <div className="border-line bg-line mt-10 grid gap-px border sm:grid-cols-2">
        {explainers.map((entry) => (
          <Link
            key={entry.slug}
            href={`/waste/${entry.slug}`}
            className="group bg-card px-6 py-6"
          >
            <h2 className="font-display group-hover:text-brand-text text-xl tracking-tight">
              {entry.name}
            </h2>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {entry.summary}
            </p>
            <p className="text-ink mt-4 text-sm font-medium underline underline-offset-4">
              {t("index.readExplainer")}
            </p>
          </Link>
        ))}
      </div>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("index.summaryHeading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t.rich("index.summaryText", {
            users: DEMO_FIGURES.users,
            amount: demoEuros(DEMO_FIGURES.monthlyWasteCents),
            findings: DEMO_FIGURES.findingsCount,
            waste: (chunks) => (
              <span className="tnum text-waste-text font-mono">{chunks}</span>
            ),
            roi: (chunks) => (
              <Link
                href="/roi"
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
            psc: (chunks) => (
              <Link
                href="/compare/powershell-audit"
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>

      {/* Final CTA band, same pattern as /roi and /compare/powershell-audit. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("index.ctaHeading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("index.ctaText")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("index.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">{t("index.ctaNote")}</p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(INDEX_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
