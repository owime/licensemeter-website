import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";

export const metadata: Metadata = {
  title: "LicenseMeter vs tracking licenses in Excel",
  description:
    "An honest comparison for IT and finance teams who keep a license spreadsheet: what a sheet does well, where it fails silently, and what live sync, activity-joined findings and a price book add.",
  alternates: { canonical: "/compare/excel-license-tracking" },
};

const BASE = siteUrl();

/*
 * The spreadsheet cells describe failure modes any owner of a license sheet
 * recognizes; no invented statistics. Every LicenseMeter cell is grounded in
 * the codebase: nightly sync with history, the rules in ~/lib/rules.ts, the
 * price book, the acknowledge/reopen workflow and the CSV/PowerShell exports.
 */
const ROW_KEYS = [
  "cost",
  "freshness",
  "activitySignal",
  "staffChanges",
  "perSeatCost",
  "coverage",
  "findingsWorkflow",
  "financeHandoff",
  "remediation",
] as const;

/* Static breadcrumb; "<" escaped so nothing can terminate the script. */
const COMPARE_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    {
      "@type": "ListItem",
      position: 2,
      name: "LicenseMeter vs tracking licenses in Excel",
      item: `${BASE}/compare/excel-license-tracking`,
    },
  ],
};

export default async function ExcelLicenseTrackingComparePage() {
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  const signInHref = signInPath();
  const t = await getTranslations("compare");

  return (
    <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {t("excel.title")}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("excel.intro")}
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("excel.sideBySide.heading")}
        </h2>
        <div className="border-line mt-8 overflow-x-auto border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-line bg-card border-b text-left">
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("excel.sideBySide.headers.dimension")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("excel.sideBySide.headers.column")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("excel.sideBySide.headers.licensemeter")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROW_KEYS.map((key) => (
                <tr key={key} className="border-line border-b last:border-b-0">
                  <th
                    scope="row"
                    className="text-ink px-4 py-4 text-left align-top font-medium whitespace-nowrap"
                  >
                    {t(`excel.sideBySide.rows.${key}.dimension`)}
                  </th>
                  <td className="text-ink-soft px-4 py-4 align-top leading-relaxed">
                    {t(`excel.sideBySide.rows.${key}.column`)}
                  </td>
                  <td className="text-ink-soft bg-card px-4 py-4 align-top leading-relaxed">
                    {t(`excel.sideBySide.rows.${key}.licensemeter`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="font-display text-2xl tracking-tight">
          {t("excel.whenEnough.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("excel.whenEnough.body")}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("excel.whatAdds.heading")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("excel.whatAdds.items.liveSync.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("excel.whatAdds.items.liveSync.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("excel.whatAdds.items.findingsNotRows.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("excel.whatAdds.items.findingsNotRows.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("excel.whatAdds.items.priceBook.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("excel.whatAdds.items.priceBook.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("excel.whatAdds.items.workflowExports.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("excel.whatAdds.items.workflowExports.body")}
            </p>
          </div>
        </div>
      </section>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="font-display text-2xl tracking-tight">
          {t("excel.startSection.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("excel.startSection.bodyBefore")}{" "}
          <a
            href={`${signInPath()}?returnTo=${encodeURIComponent("/app/connect/csv")}`}
            className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
          >
            {t("excel.startSection.linkText")}
          </a>{" "}
          {t("excel.startSection.bodyAfter")}
        </p>
      </section>

      {/* Final CTA band, same pattern as the landing page and /msp. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("excel.finalCta.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("excel.finalCta.bodyBefore")}{" "}
          <Link
            href="/security"
            className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
          >
            {t("excel.finalCta.linkText")}
          </Link>{" "}
          {t("excel.finalCta.bodyAfter")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("excel.finalCta.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">
            {t("excel.finalCta.note")}
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(COMPARE_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
