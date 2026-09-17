import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";

export const metadata: Metadata = {
  title: "LicenseMeter vs the Microsoft 365 admin center",
  description:
    "An honest comparison for admins who work from Billing > Licenses and Reports > Usage: what the admin center answers well, and what a joined, priced, continuously monitored view adds.",
  alternates: { canonical: "/compare/m365-admin-center" },
};

const BASE = siteUrl();

/*
 * Every admin-center cell is grounded in Microsoft's own documentation
 * (learn.microsoft.com: activity-reports overview, active-users-ww,
 * assign-licenses-to-users, reports-show-anonymous-user-name) and every
 * LicenseMeter cell in the codebase: the rules in ~/lib/rules.ts, the price
 * book, the digest and monthly-report crons, and the CSV/PowerShell exports.
 * No invented numbers.
 */
const ROW_KEYS = [
  "cost",
  "assignmentCounts",
  "activityPerUser",
  "userNames",
  "euroFigures",
  "cadenceAlerts",
  "offboardingLeaks",
  "financeHandoff",
  "remediation",
  "beyondM365",
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
      name: "LicenseMeter vs the Microsoft 365 admin center",
      item: `${BASE}/compare/m365-admin-center`,
    },
  ],
};

export default async function M365AdminCenterComparePage() {
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
        {t("m365AdminCenter.title")}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("m365AdminCenter.intro")}
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("m365AdminCenter.sideBySide.heading")}
        </h2>
        <div className="border-line mt-8 overflow-x-auto border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-line bg-card border-b text-left">
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("m365AdminCenter.sideBySide.headers.dimension")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("m365AdminCenter.sideBySide.headers.column")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("m365AdminCenter.sideBySide.headers.licensemeter")}
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
                    {t(`m365AdminCenter.sideBySide.rows.${key}.dimension`)}
                  </th>
                  <td className="text-ink-soft px-4 py-4 align-top leading-relaxed">
                    {t(`m365AdminCenter.sideBySide.rows.${key}.column`)}
                  </td>
                  <td className="text-ink-soft bg-card px-4 py-4 align-top leading-relaxed">
                    {t(`m365AdminCenter.sideBySide.rows.${key}.licensemeter`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="font-display text-2xl tracking-tight">
          {t("m365AdminCenter.whenEnough.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("m365AdminCenter.whenEnough.body")}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("m365AdminCenter.whatAdds.heading")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("m365AdminCenter.whatAdds.items.perUserJoin.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("m365AdminCenter.whatAdds.items.perUserJoin.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("m365AdminCenter.whatAdds.items.euroPerSeat.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("m365AdminCenter.whatAdds.items.euroPerSeat.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("m365AdminCenter.whatAdds.items.watching.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("m365AdminCenter.whatAdds.items.watching.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("m365AdminCenter.whatAdds.items.concealedNames.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("m365AdminCenter.whatAdds.items.concealedNames.body")}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA band, same pattern as the landing page and /msp. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("m365AdminCenter.finalCta.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("m365AdminCenter.finalCta.bodyBefore")}{" "}
          <Link
            href="/security"
            className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
          >
            {t("m365AdminCenter.finalCta.linkText")}
          </Link>{" "}
          {t("m365AdminCenter.finalCta.bodyAfter")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("m365AdminCenter.finalCta.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">
            {t("m365AdminCenter.finalCta.note")}
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
