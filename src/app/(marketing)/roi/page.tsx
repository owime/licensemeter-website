import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { RoiCalculator } from "~/components/RoiCalculator";
import { SignInButtons } from "~/components/SignInButtons";
import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";

export const metadata: Metadata = {
  title: "Microsoft 365 license waste calculator",
  description:
    "Estimate what unused Microsoft 365 licenses cost you per month: seats times per-seat cost times an assumed waste share. Runs entirely in your browser, no data leaves the page.",
  alternates: { canonical: "/roi" },
};

const BASE = siteUrl();

/* Static breadcrumb; "<" escaped so nothing can terminate the script. */
const ROI_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    {
      "@type": "ListItem",
      position: 2,
      name: "License waste calculator",
      item: `${BASE}/roi`,
    },
  ],
};

export default async function RoiPage() {
  const t = await getTranslations("roi");
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  const signInHref = signInPath();

  const wasteDrivers = t.raw("drivers.items") as {
    title: string;
    body: string;
  }[];

  return (
    <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {t("heading")}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {t("intro")}
      </p>

      <div className="mt-10">
        <RoiCalculator />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("drivers.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-2xl text-sm leading-relaxed">
          {t("drivers.intro")}
        </p>
        <div className="border-line bg-line mt-8 grid gap-px border sm:grid-cols-2">
          {wasteDrivers.map((driver) => (
            <div key={driver.title} className="bg-card px-6 py-6">
              <h3 className="font-display text-xl tracking-tight">
                {driver.title}
              </h3>
              <p className="text-ink-soft mt-3 text-sm leading-relaxed">
                {driver.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl tracking-tight">
            {t("how.heading")}
          </h2>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            {t("how.body")}
          </p>
        </div>
        <div className="border-line bg-card border px-6 py-6">
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
            {t("detection.heading")}
          </h2>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            {t("detection.intro")}{" "}
            {t("detection.stats", { users: DEMO_FIGURES.users })}{" "}
            <span className="tnum text-waste-text font-mono">
              € {demoEuros(DEMO_FIGURES.monthlyWasteCents)}
            </span>{" "}
            {t("detection.suffix", {
              findingsCount: DEMO_FIGURES.findingsCount,
            })}
          </p>
          <p className="text-ink-faint mt-3 text-xs">{t("detection.note")}</p>
        </div>
      </section>

      {/* Final CTA band, same pattern as the landing page and /msp. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("final.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("final.body")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("final.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">{t("final.note")}</p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ROI_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
