import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";
import {
  DEMO_ANNUAL_WASTE_ROUNDED,
  DEMO_FIGURES,
  demoEuros,
} from "~/lib/demoFigures";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("sampleReport");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/sample-report" },
  };
};

const BASE = siteUrl();

/*
 * Every figure on this page comes from DEMO_FIGURES, which
 * demoFigures.test.ts recomputes from the demo fixtures and the rules engine.
 * The tenant is a synthetic fixture, labeled as such throughout - this page
 * must never read as a customer case study. Display labels come from the
 * "sampleReport" message namespace; only the underlying numbers live here.
 */
type Translate = (key: string, values?: Record<string, string | number>) => string;

const headlineStats = (t: Translate) =>
  [
    { label: t("stats.users"), value: String(DEMO_FIGURES.users) },
    {
      label: t("stats.spend"),
      value: `€ ${demoEuros(DEMO_FIGURES.monthlySpendCents)}`,
    },
    { label: t("stats.findings"), value: String(DEMO_FIGURES.findingsCount) },
    {
      label: t("stats.recoverable"),
      value: `€ ${demoEuros(DEMO_FIGURES.monthlyWasteCents)}`,
    },
  ] as const;

/* Same category labels as the landing ledger card, so the two views of the
 * demo tenant can never drift apart. Sums to monthlyWasteCents. */
const findingRows = (t: Translate) =>
  [
    {
      category: t("categories.leavers.category"),
      flags: t("categories.leavers.flags"),
      cents: DEMO_FIGURES.byCategory.leavers,
    },
    {
      category: t("categories.idle.category"),
      flags: t("categories.idle.flags"),
      cents: DEMO_FIGURES.byCategory.idle,
    },
    {
      category: t("categories.shelfware.category"),
      flags: t("categories.shelfware.flags"),
      cents: DEMO_FIGURES.byCategory.shelfware,
    },
    {
      category: t("categories.copilotUnused.category"),
      flags: t("categories.copilotUnused.flags"),
      cents: DEMO_FIGURES.byCategory.copilotUnused,
    },
    {
      category: t("categories.orphaned.category"),
      flags: t("categories.orphaned.flags"),
      cents: DEMO_FIGURES.byCategory.orphaned,
    },
    {
      category: t("categories.guests.category"),
      flags: t("categories.guests.flags"),
      cents: DEMO_FIGURES.byCategory.guests,
    },
  ] as const;

/* Static breadcrumb; "<" escaped so nothing can terminate the script. */
const SAMPLE_REPORT_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    {
      "@type": "ListItem",
      position: 2,
      name: "Sample license waste report",
      item: `${BASE}/sample-report`,
    },
  ],
};

export default async function SampleReportPage() {
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  const signInHref = signInPath();
  const t = await getTranslations("sampleReport");
  const HEADLINE_STATS = headlineStats(t);
  const FINDING_ROWS = findingRows(t);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {t("h1")}
      </h1>
      <p className="bg-brand-soft text-brand-deep mt-5 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
        {t("badge")}
      </p>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("intro", { orgName: DEMO_FIGURES.orgName, users: DEMO_FIGURES.users })}
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("tenantHeading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("tenantText")}
        </p>
        <dl className="border-line bg-line mt-8 grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE_STATS.map((stat) => (
            <div key={stat.label} className="bg-card px-5 py-5">
              <dt className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
                {stat.label}
              </dt>
              <dd className="font-display tnum mt-2 text-2xl tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-faint mt-3 text-xs">{t("statsNote")}</p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("firstScanHeading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t.rich("firstScanText", {
            findings: DEMO_FIGURES.findingsCount,
            amount: demoEuros(DEMO_FIGURES.monthlyWasteCents),
            annual: DEMO_ANNUAL_WASTE_ROUNDED,
            waste: (chunks) => (
              <span className="tnum text-waste-text font-mono">{chunks}</span>
            ),
          })}
        </p>
        <div className="border-line mt-8 overflow-x-auto border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-line bg-card border-b text-left">
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("table.category")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("table.flags")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-right text-xs font-medium tracking-[0.18em] uppercase">
                  {t("table.wastePerMonth")}
                </th>
              </tr>
            </thead>
            <tbody>
              {FINDING_ROWS.map((row) => (
                <tr
                  key={row.category}
                  className="border-line border-b last:border-b-0"
                >
                  <th
                    scope="row"
                    className="text-ink px-4 py-4 text-left align-top font-medium"
                  >
                    {row.category}
                  </th>
                  <td className="text-ink-soft px-4 py-4 align-top leading-relaxed">
                    {row.flags}
                  </td>
                  <td className="tnum px-4 py-4 text-right align-top font-mono whitespace-nowrap">
                    € {demoEuros(row.cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-soft mt-6 max-w-3xl text-sm leading-relaxed">
          {t("offboardingNote", {
            leaverCount: DEMO_FIGURES.leaverCount,
            crossVendorLeaverCount: DEMO_FIGURES.crossVendorLeaverCount,
          })}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("withoutLoginHeading")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("digest.heading")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("digest.text")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("pdf.heading")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t.rich("pdf.text", {
                amount: demoEuros(DEMO_FIGURES.monthlyWasteCents),
                waste: (chunks) => (
                  <span className="tnum text-waste-text font-mono">
                    {chunks}
                  </span>
                ),
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("remediationHeading")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("script.heading")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("script.text")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("acknowledge.heading")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("acknowledge.text")}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA band, same pattern as the landing page and /msp. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("cta.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t.rich("cta.text", {
            security: (chunks) => (
              <Link
                href="/security"
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            primaryLabel={t("cta.primaryLabel")}
          />
        </div>
      </section>

      <p className="text-ink-faint mt-10 text-xs">{t("footerNote")}</p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SAMPLE_REPORT_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
