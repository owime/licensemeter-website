import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SUPPORT_EMAIL } from "~/lib/support";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  robots: { index: false },
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-8">
    <h2 className="text-ink font-medium">{title}</h2>
    <div className="text-ink-soft mt-2 flex flex-col gap-2 text-sm leading-relaxed">
      {children}
    </div>
  </section>
);

export default async function TermsPage() {
  const t = await getTranslations("terms");

  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">{t("title")}</h1>
      <p className="text-ink-faint mt-3 text-xs">{t("lastUpdated")}</p>

      <Section title={t("sections.scope.title")}>
        <p>{t("sections.scope.body")}</p>
      </Section>

      <Section title={t("sections.description.title")}>
        <p>{t("sections.description.p1")}</p>
        <p>{t("sections.description.p2")}</p>
      </Section>

      <Section title={t("sections.registration.title")}>
        <p>{t("sections.registration.body")}</p>
      </Section>

      <Section title={t("sections.processing.title")}>
        <p>
          {t.rich("sections.processing.body", {
            dpaLink: (chunks) => (
              <a
                href="/dpa"
                className="hover:text-ink underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </Section>

      <Section title={t("sections.obligations.title")}>
        <p>{t("sections.obligations.body")}</p>
      </Section>

      <Section title={t("sections.freeAccess.title")}>
        <p>{t("sections.freeAccess.body")}</p>
      </Section>

      <Section title={t("sections.availability.title")}>
        <p>{t("sections.availability.body", { email: SUPPORT_EMAIL })}</p>
      </Section>

      <Section title={t("sections.liability.title")}>
        <p>{t("sections.liability.body")}</p>
      </Section>

      <Section title={t("sections.term.title")}>
        <p>{t("sections.term.body")}</p>
      </Section>

      <Section title={t("sections.changes.title")}>
        <p>{t("sections.changes.body")}</p>
      </Section>

      <Section title={t("sections.final.title")}>
        <p>{t("sections.final.body")}</p>
      </Section>
    </main>
  );
}
