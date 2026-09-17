import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { buttonClass } from "~/components/ui";

/**
 * Shown on the dashboard when a workspace has connected no service yet. Sign-in
 * no longer forces a Microsoft connect gate (workspace-first onboarding): the
 * user lands here and chooses the supported first step: connect Microsoft 365
 * or use the no-admin CSV assessment. SaaS connectors unlock once a directory
 * exists so their seats can be correlated to people.
 *
 * Connector logos are intentionally not used (vendor brand-usage constraints):
 * a neutral monogram + the product name only.
 */

const Monogram = ({ name }: { name: string }) => (
  <span
    aria-hidden="true"
    className="border-line bg-canvas font-display text-ink-soft flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm"
  >
    {name.charAt(0)}
  </span>
);

export const OnboardingEmptyState = async () => {
  const t = await getTranslations("dashboardHome.onboardingEmptyState");

  const SECONDARY = [
    {
      name: t("secondary.adobe.name"),
      blurb: t("secondary.adobe.blurb"),
      href: "/app/connectors/adobe",
    },
    {
      name: t("secondary.zoom.name"),
      blurb: t("secondary.zoom.blurb"),
      href: "/app/connectors/zoom",
    },
    {
      name: t("secondary.atlassian.name"),
      blurb: t("secondary.atlassian.blurb"),
      href: "/app/connectors/atlassian",
    },
    {
      name: t("secondary.salesforce.name"),
      blurb: t("secondary.salesforce.blurb"),
      href: "/app/connectors/salesforce",
    },
    {
      name: t("secondary.chatgpt.name"),
      blurb: t("secondary.chatgpt.blurb"),
      href: "/app/connectors/chatgpt",
    },
    {
      name: t("secondary.claude.name"),
      blurb: t("secondary.claude.blurb"),
      href: "/app/connectors/claude",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl py-6">
      <header className="rise rise-1">
        <p className="text-brand-text text-xs font-medium tracking-[0.14em] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-display mt-3 text-3xl tracking-tight">
          {t("title")}
        </h1>
        <p className="text-ink-soft mt-2 max-w-xl text-sm leading-relaxed">
          {t("intro")}
        </p>
      </header>

      {/* Microsoft 365 is the directory all SaaS seats are correlated against. */}
      <Link
        href="/app/connectors/microsoft"
        data-tour="connect-cta"
        className="rise rise-2 group border-line bg-card hover:border-ink-soft mt-6 block border p-5 transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Monogram name={t("microsoft.name")} />
            <div>
              <p className="text-ink font-medium">{t("microsoft.name")}</p>
              <p className="text-ink-soft mt-0.5 text-sm">
                {t("microsoft.desc")}
              </p>
            </div>
          </div>
          <span
            className={buttonClass(
              "primary",
              "hidden shrink-0 sm:inline-flex",
            )}
          >
            {t("microsoft.connect")}
          </span>
        </div>
      </Link>

      <Link
        href="/app/connect/csv"
        className="rise rise-2 border-line bg-card hover:border-ink-soft mt-3 flex min-h-20 items-center gap-3 border px-5 py-4 transition-colors"
      >
        <Monogram name="CSV" />
        <span className="min-w-0">
          <span className="text-ink block text-sm font-medium">
            {t("csv.title")}
          </span>
          <span className="text-ink-soft mt-0.5 block text-sm">
            {t("csv.desc")}
          </span>
        </span>
      </Link>

      <div className="rise rise-3 mt-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg">{t("addMore.heading")}</h2>
          <p className="text-ink-soft mt-1 text-sm">{t("addMore.sub")}</p>
        </div>
      </div>
      <div className="rise rise-3 border-line bg-line mt-3 grid gap-px border sm:grid-cols-2">
        {SECONDARY.map((tile) => (
          <div
            key={tile.name}
            className="bg-card flex min-h-16 items-center gap-3 px-4 py-3.5"
          >
            <Monogram name={tile.name} />
            <span className="min-w-0">
              <span className="text-ink block text-sm font-medium">
                {tile.name}
              </span>
              <span className="text-ink-faint block truncate text-xs">
                {tile.blurb}
              </span>
            </span>
            <span className="text-ink-faint ml-auto shrink-0 text-[11px] font-medium tracking-wide uppercase">
              {t("afterMicrosoft")}
            </span>
          </div>
        ))}
      </div>

      <div className="rise rise-3 text-ink-soft mt-4 text-sm">
        <Link
          href="/security"
          className="text-ink inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline"
        >
          {t("reviewPermissions")}
        </Link>
      </div>
    </div>
  );
};
