import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SUBPROCESSORS } from "~/lib/dpa";
import { SUPPORT_EMAIL } from "~/lib/support";

export const metadata: Metadata = {
  title: "Privacy Policy",
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

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("privacy");
  const linkClass = "hover:text-ink underline underline-offset-4";

  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">{t("title")}</h1>
      <p className="text-ink-faint mt-3 text-xs">{t("lastUpdated")}</p>

      <Section title={t("sections.controller.title")}>
        <p>
          {t("sections.controller.line1")}
          <br />
          {t("sections.controller.line2")}
          <br />
          {t("sections.controller.line3")}
          <br />
          {t("sections.controller.line4", { email: SUPPORT_EMAIL })}
        </p>
      </Section>

      <Section title={t("sections.visiting.title")}>
        <p>{t("sections.visiting.p1")}</p>
        <p>
          {t.rich("sections.visiting.p2", {
            cookieLink: (chunks) => (
              <a href="/cookies" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t("sections.visiting.p3")}</p>
      </Section>

      <Section title={t("sections.signIn.title")}>
        <p>{t("sections.signIn.p1")}</p>
        <p>
          {t.rich("sections.signIn.p2", {
            cookieLink: (chunks) => (
              <a href="/cookies" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
      </Section>

      <Section title={t("sections.productData.title")}>
        <p>{t("sections.productData.p1")}</p>
        <p>{t("sections.productData.p2")}</p>
        <p>{t("sections.productData.p3")}</p>
      </Section>

      <Section title={t("sections.freeService.title")}>
        <p>{t("sections.freeService.body")}</p>
      </Section>

      <Section title={t("sections.support.title")}>
        <p>{t("sections.support.p1")}</p>
        <p>{t("sections.support.p2")}</p>
        <p>
          {t.rich("sections.support.p3", {
            email: SUPPORT_EMAIL,
            crispLink: (chunks) => (
              <a
                href="https://crisp.chat/en/privacy/"
                className="underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </Section>

      <Section title={t("sections.subprocessors.title")}>
        <p>{t("sections.subprocessors.intro")}</p>
        <ul className="flex flex-col gap-1.5">
          {SUBPROCESSORS.map((sp) => (
            <li key={sp.name} className="flex gap-2.5">
              <span aria-hidden="true" className="text-moss mt-0.5">
                ·
              </span>
              <span>
                <span className="text-ink">{sp.name}</span>: {sp.purpose},{" "}
                {sp.location} ({sp.basis}).
              </span>
            </li>
          ))}
        </ul>
        <p>
          {t.rich("sections.subprocessors.listNote", {
            dpaLink: (chunks) => (
              <a href="/dpa" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t("sections.subprocessors.distinguish")}</p>
      </Section>

      <Section title={t("sections.retention.title")}>
        <p>{t("sections.retention.body")}</p>
      </Section>

      <Section title={t("sections.rights.title")}>
        <p>{t("sections.rights.body")}</p>
      </Section>

      <Section title={t("sections.contact.title")}>
        <p>{t("sections.contact.body", { email: SUPPORT_EMAIL })}</p>
      </Section>
    </main>
  );
}
