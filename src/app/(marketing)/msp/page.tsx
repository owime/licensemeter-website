import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { buttonClass } from "~/components/ui";
import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";
import { SUPPORT_MAILTO } from "~/lib/support";

export const metadata: Metadata = {
  title: "For MSPs",
  description:
    "LicenseMeter for Microsoft-centric MSPs: a portfolio of client tenants sorted by waste, admin consent without shared credentials, per-client price books and a PDF waste report for every QBR.",
};

const STEP_NUMBERS = ["01", "02", "03"] as const;

const BASE = siteUrl();

/* Static breadcrumb; "<" escaped so nothing can terminate the script. */
const MSP_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    {
      "@type": "ListItem",
      position: 2,
      name: "For MSPs",
      item: `${BASE}/msp`,
    },
  ],
};

/* CTA hierarchy mirrors the rest of the marketing site: the primary action is
 * self-serve sign-in (WorkOS AuthKit), landing the MSP on the portfolio page
 * where they can review connected client workspaces. The live demo and support
 * are available when sign-in is not configured. */
const Ctas = ({
  demoEnabled,
  signInOk,
  startHref,
  t,
}: {
  demoEnabled: boolean;
  signInOk: boolean;
  startHref: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) => (
  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    {signInOk ? (
      <a
        href={startHref}
        className={buttonClass("primary", "w-full sm:w-auto")}
      >
        {t("cta.startFree")}
      </a>
    ) : (
      <a
        href={SUPPORT_MAILTO}
        className={buttonClass("primary", "w-full sm:w-auto")}
      >
        {t("cta.talkToUs")}
      </a>
    )}
    {demoEnabled && (
      <form action="/api/auth/demo" method="post">
        <button className={buttonClass("secondary", "w-full sm:w-auto")}>
          {t("cta.openDemo")}
        </button>
      </form>
    )}
    {signInOk && (
      <a
        href={SUPPORT_MAILTO}
        className="text-brand-text inline-flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4 hover:opacity-80 sm:justify-start"
      >
        {t("cta.talkToUs")}
      </a>
    )}
  </div>
);

export default async function MspPage() {
  const t = await getTranslations("msp");
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  /* Land on the MSP portfolio: create the account, then attach the first
   * client. Same returnTo pattern the homepage use. */
  const startHref = `${signInPath()}?returnTo=${encodeURIComponent("/app/portfolio")}`;

  const steps = t.raw("steps.items") as { title: string; body: string }[];
  const features = t.raw("features") as { title: string; body: string }[];
  const trustItems = t.raw("trust.items") as string[];

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
      <div className="mt-8">
        <Ctas
          demoEnabled={demoEnabled}
          signInOk={signInOk}
          startHref={startHref}
          t={t}
        />
        {signInOk && (
          <p className="text-ink-faint mt-3 text-xs">{t("cta.note")}</p>
        )}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("steps.heading")}
        </h2>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title}>
              <div className="text-brand-text font-mono text-xs">
                {STEP_NUMBERS[index]}
              </div>
              <h3 className="font-display mt-3 text-xl tracking-tight">
                {step.title}
              </h3>
              <p className="text-ink-soft mt-3 text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-line bg-card mt-14 border px-6 py-6">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("finding.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">
          {t("finding.intro")}{" "}
          {t("finding.stats", {
            leaverCount: DEMO_FIGURES.leaverCount,
            crossVendorCount: DEMO_FIGURES.crossVendorLeaverCount,
          })}{" "}
          {t("finding.thats")}{" "}
          <span className="tnum text-waste-text font-mono">
            € {demoEuros(DEMO_FIGURES.byCategory.leavers)}
          </span>{" "}
          {t("finding.suffix")}
        </p>
      </section>

      <section className="border-line bg-line mt-14 grid gap-px border sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="bg-card px-6 py-6">
            <h2 className="font-display text-xl tracking-tight">{f.title}</h2>
            <p className="text-ink-soft mt-3 text-sm leading-relaxed">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("trust.heading")}
        </h2>
        <ul className="text-ink-soft mt-4 flex flex-col gap-2 text-sm">
          {trustItems.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="text-moss mt-0.5">
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-ink-soft mt-4 text-sm">
          {t("trust.securityPrefix") ? `${t("trust.securityPrefix")} ` : ""}
          <Link
            href="/security"
            className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
          >
            {t("trust.securityLinkLabel")}
          </Link>{" "}
          {t("trust.securitySuffix")}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">
          {t("free.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-2xl text-sm leading-relaxed">
          {t("free.body")}
        </p>
        <div className="mt-8">
          <Ctas
            demoEnabled={demoEnabled}
            signInOk={signInOk}
            startHref={startHref}
            t={t}
          />
        </div>
      </section>

      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("final.heading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("final.body")}
        </p>
        <div className="mt-8">
          <Ctas
            demoEnabled={demoEnabled}
            signInOk={signInOk}
            startHref={startHref}
            t={t}
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(MSP_LD).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
