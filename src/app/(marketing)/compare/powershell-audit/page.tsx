import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { SignInButtons } from "~/components/SignInButtons";
import { CONNECTOR_SCOPES } from "~/lib/scopes";

export const metadata: Metadata = {
  title: "LicenseMeter vs a manual PowerShell audit",
  description:
    "An honest comparison for admins who audit Microsoft 365 licenses with Get-MgUser and Get-MgSubscribedSku: what a script does well, and what continuous, priced, joined-signal monitoring adds.",
  alternates: { canonical: "/compare/powershell-audit" },
};

const BASE = siteUrl();

/*
 * Every LicenseMeter cell is grounded in the codebase: the rules in
 * ~/lib/rules.ts, the read-only scopes in ~/lib/scopes.ts, the graceful
 * degradation described in README.md, the price book, the acknowledge/reopen
 * finding actions and the CSV/PowerShell exports. No invented numbers.
 */
const ROW_KEYS = [
  "cost",
  "dataGathering",
  "signInActivity",
  "euroFigures",
  "cadence",
  "findingsWorkflow",
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
      name: "LicenseMeter vs a manual PowerShell audit",
      item: `${BASE}/compare/powershell-audit`,
    },
  ],
};

export default async function PowershellAuditComparePage() {
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
        {t("powershellAudit.title")}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("powershellAudit.introBefore")}{" "}
        <code className="tnum font-mono text-base">Get-MgUser</code>{" "}
        {t("powershellAudit.introMiddle")}{" "}
        <code className="tnum font-mono text-base">Get-MgSubscribedSku</code>{" "}
        {t("powershellAudit.introAfter")}
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("powershellAudit.sideBySide.heading")}
        </h2>
        <div className="border-line mt-8 overflow-x-auto border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-line bg-card border-b text-left">
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("powershellAudit.sideBySide.headers.dimension")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("powershellAudit.sideBySide.headers.column")}
                </th>
                <th className="text-ink-faint px-4 py-3 text-xs font-medium tracking-[0.18em] uppercase">
                  {t("powershellAudit.sideBySide.headers.licensemeter")}
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
                    {t(`powershellAudit.sideBySide.rows.${key}.dimension`)}
                  </th>
                  <td className="text-ink-soft px-4 py-4 align-top leading-relaxed">
                    {t(`powershellAudit.sideBySide.rows.${key}.column`)}
                  </td>
                  <td className="text-ink-soft bg-card px-4 py-4 align-top leading-relaxed">
                    {t(`powershellAudit.sideBySide.rows.${key}.licensemeter`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="font-display text-2xl tracking-tight">
          {t("powershellAudit.whenEnough.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("powershellAudit.whenEnough.body")}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("powershellAudit.whatAdds.heading")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("powershellAudit.whatAdds.items.joinMaintained.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("powershellAudit.whatAdds.items.joinMaintained.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("powershellAudit.whatAdds.items.memoryBetweenRuns.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("powershellAudit.whatAdds.items.memoryBetweenRuns.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("powershellAudit.whatAdds.items.numbersFinanceAccepts.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("powershellAudit.whatAdds.items.numbersFinanceAccepts.body")}
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl tracking-tight">
              {t("powershellAudit.whatAdds.items.saferPermissions.title")}
            </h3>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {t("powershellAudit.whatAdds.items.saferPermissions.bodyBefore")}{" "}
              {CONNECTOR_SCOPES.length}{" "}
              {t("powershellAudit.whatAdds.items.saferPermissions.bodyMiddle")}
              {CONNECTOR_SCOPES.map((s) => s.scope).join(", ")}
              {t("powershellAudit.whatAdds.items.saferPermissions.bodyMiddle2")}{" "}
              <Link
                href="/security"
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {t("powershellAudit.whatAdds.items.saferPermissions.linkText")}
              </Link>
              {t("powershellAudit.whatAdds.items.saferPermissions.bodyAfter")}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA band, same pattern as the landing page and /msp. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("powershellAudit.finalCta.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("powershellAudit.finalCta.body")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("powershellAudit.finalCta.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">
            {t("powershellAudit.finalCta.note")}
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
