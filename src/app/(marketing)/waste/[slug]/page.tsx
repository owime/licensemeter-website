import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isDemoMode, signInEnabled, signInPath, siteUrl } from "~/env";
import { DemoClip } from "~/components/landing/DemoClip";
import { SignInButtons } from "~/components/SignInButtons";

import { WASTE_EXPLAINERS, buildWasteExplainers, wasteExplainer } from "../content";

type Params = { slug: string };

export const generateStaticParams = (): Params[] =>
  WASTE_EXPLAINERS.map((e) => ({ slug: e.slug }));

export const dynamicParams = false;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> => {
  const t = await getTranslations("waste");
  const entry = wasteExplainer(t, (await params).slug);
  if (!entry) return {};
  return {
    title: entry.metaTitle,
    description: entry.metaDescription,
    alternates: { canonical: `/waste/${entry.slug}` },
  };
};

const BASE = siteUrl();

export default async function WasteExplainerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const t = await getTranslations("waste");
  const entry = wasteExplainer(t, (await params).slug);
  if (!entry) notFound();
  const demoEnabled = isDemoMode();
  const signInOk = signInEnabled();
  const signInHref = signInPath();
  const related = buildWasteExplainers(t).filter((e) => e.slug !== entry.slug);

  /* Static breadcrumb; "<" escaped so nothing can terminate the script. */
  const pageLd = {
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
      {
        "@type": "ListItem",
        position: 3,
        name: entry.name,
        item: `${BASE}/waste/${entry.slug}`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <nav
        aria-label="Breadcrumb"
        className="text-ink-faint text-xs font-medium tracking-[0.2em] uppercase"
      >
        <Link
          href="/waste"
          className="hover:text-ink underline-offset-4 hover:underline"
        >
          {t("detail.breadcrumbRoot")}
        </Link>{" "}
        /{" "}
        <span aria-current="page" className="text-brand-text">
          {entry.name}
        </span>
      </nav>

      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {entry.h1}
      </h1>
      <p className="text-ink-soft mt-4 max-w-2xl text-lg leading-relaxed">
        {entry.intro}
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">
          {entry.what.heading}
        </h2>
        {entry.what.paragraphs.map((p) => (
          <p key={p} className="text-ink-soft mt-3 text-sm leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">
          {entry.manual.heading}
        </h2>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          {entry.manual.intro}
        </p>
        <pre className="border-line bg-card mt-4 overflow-x-auto border px-4 py-4 text-xs leading-relaxed">
          <code className="font-mono">{entry.manual.snippet}</code>
        </pre>
        <ul className="text-ink-soft mt-4 flex flex-col gap-2 text-sm leading-relaxed">
          {entry.manual.notes.map((note) => (
            <li key={note} className="flex gap-3">
              <span aria-hidden="true" className="text-brand-text mt-0.5">
                ·
              </span>
              {note}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">
          {entry.automatic.heading}
        </h2>
        {entry.automatic.paragraphs.map((p) => (
          <p key={p} className="text-ink-soft mt-3 text-sm leading-relaxed">
            {p}
          </p>
        ))}
        <DemoClip
          src="/videos/feature-findings.mp4"
          poster="/videos/feature-findings.webp"
          label="Product demo: filtering and acknowledging findings"
          caption="The findings list in the demo workspace: filter by rule, select the affected seats, acknowledge in bulk."
          className="mt-6"
        />
      </section>

      <section className="border-line bg-card mt-12 border px-6 py-6">
        <h2 className="font-display text-2xl tracking-tight">
          {entry.cost.heading}
        </h2>
        {entry.cost.paragraphs.map((p) => (
          <p key={p} className="text-ink-soft mt-3 text-sm leading-relaxed">
            {p}
          </p>
        ))}
        <p className="text-ink-faint mt-3 text-xs">
          {t.rich("detail.sampleFiguresNote", {
            roi: (chunks) => (
              <Link
                href="/roi"
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">
          {t("detail.relatedHeading")}
        </h2>
        <ul className="text-ink-soft mt-4 flex flex-col gap-2 text-sm leading-relaxed">
          {related.map((e) => (
            <li key={e.slug} className="flex gap-3">
              <span aria-hidden="true" className="text-brand-text mt-0.5">
                ·
              </span>
              <Link
                href={`/waste/${e.slug}`}
                className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
              >
                {e.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA band, same pattern as /roi and /compare/powershell-audit. */}
      <section className="border-line mt-14 border-t pt-10">
        <h2 className="font-display text-3xl tracking-tight text-balance">
          {t("detail.ctaHeading")}
        </h2>
        <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
          {t("detail.ctaText")}
        </p>
        <div className="mt-8">
          <SignInButtons
            signInEnabled={signInOk}
            signInHref={signInHref}
            demoEnabled={demoEnabled}
            showNote={false}
            primaryLabel={t("detail.primaryLabel")}
          />
          <p className="text-ink-faint mt-3 text-xs">{t("detail.ctaNote")}</p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageLd).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
