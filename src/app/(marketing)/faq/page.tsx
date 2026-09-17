import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { siteUrl } from "~/env";
import { CONNECTOR_SCOPES } from "~/lib/scopes";
import { SUPPORT_MAILTO } from "~/lib/support";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "The questions IT and security teams ask before granting LicenseMeter admin consent: write access, mailbox content, data residency, retention, Entra P1, DPA.",
};

const BASE = siteUrl();

/** Stable anchor per question so answers can be deep-linked. */
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const rawFaqs = t.raw("items") as { q: string; a: string }[];
  /* One answer carries a runtime placeholder ({scopeCount}) for the number of
   * connector scopes, since that count isn't static translated copy. */
  const faqs = rawFaqs.map((item) => ({
    q: item.q,
    a: item.a.replace("{scopeCount}", String(CONNECTOR_SCOPES.length)),
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <p className="text-brand-text text-xs font-medium tracking-[0.2em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance">
        {t("heading")}
      </h1>

      <h2 id="faq-list-heading" className="sr-only">
        {t("questionsHeading")}
      </h2>
      <dl
        aria-labelledby="faq-list-heading"
        className="border-line bg-card mt-10 border"
      >
        {faqs.map((item) => (
          <div
            key={item.q}
            id={slugify(item.q)}
            className="border-line scroll-mt-24 border-b px-6 py-5 last:border-b-0"
          >
            <dt className="text-ink font-medium">{item.q}</dt>
            <dd className="text-ink-soft mt-2 text-sm leading-relaxed">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-ink-soft mt-8 text-sm">
        {t("outro.prefix")}{" "}
        <a
          href={SUPPORT_MAILTO}
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          {t("outro.ask")}
        </a>{" "}
        {t("outro.or")}{" "}
        <Link
          href="/security"
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          {t("outro.security")}
        </Link>
        .
      </p>

      <script
        type="application/ld+json"
        // Mirrors the rendered (translated) Q&A above so structured data never
        // diverges from what visitors see; "<" escaped so nothing can
        // terminate the script element.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "FAQPage",
                mainEntity: faqs.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: BASE,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "FAQ",
                    item: `${BASE}/faq`,
                  },
                ],
              },
            ],
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
