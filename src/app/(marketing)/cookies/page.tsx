import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SUPPORT_EMAIL } from "~/lib/support";

export const metadata: Metadata = {
  title: "Cookie Policy",
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

export default async function CookiesPage() {
  const t = await getTranslations("cookies");
  const codeTag = {
    code: (chunks: React.ReactNode) => <code>{chunks}</code>,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <h1 className="font-display text-4xl tracking-tight">{t("title")}</h1>
      <p className="text-ink-faint mt-3 text-xs">{t("lastUpdated")}</p>

      <Section title={t("sections.short.title")}>
        <p>{t("sections.short.body")}</p>
      </Section>

      <Section title={t("sections.whatAre.title")}>
        <p>{t("sections.whatAre.body")}</p>
      </Section>

      <Section title={t("sections.necessary.title")}>
        <p>{t("sections.necessary.intro")}</p>
        <div className="border-line bg-card mt-2 overflow-hidden border">
          <table className="w-full text-left text-xs">
            <thead className="text-ink-faint">
              <tr className="border-line border-b">
                <th className="px-4 py-2 font-medium">
                  {t("sections.necessary.table.cookie")}
                </th>
                <th className="px-4 py-2 font-medium">
                  {t("sections.necessary.table.purpose")}
                </th>
                <th className="px-4 py-2 font-medium">
                  {t("sections.necessary.table.retention")}
                </th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              <tr className="border-line border-b">
                <td className="text-ink px-4 py-2 font-mono">wos-session</td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.wosSession.purpose")}
                </td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.wosSession.retention")}
                </td>
              </tr>
              <tr className="border-line border-b">
                <td className="text-ink px-4 py-2 font-mono">lm_session</td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmSession.purpose")}
                </td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmSession.retention")}
                </td>
              </tr>
              <tr className="border-line border-b">
                <td className="text-ink px-4 py-2 font-mono">lm_oauth</td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmOauth.purpose")}
                </td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmOauth.retention")}
                </td>
              </tr>
              <tr>
                <td className="text-ink px-4 py-2 font-mono">lm_ws</td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmWs.purpose")}
                </td>
                <td className="px-4 py-2">
                  {t("sections.necessary.table.rows.lmWs.retention")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-ink-faint text-xs">
          {t.rich("sections.necessary.hostPrefixNote", codeTag)}
        </p>
      </Section>

      <Section title={t("sections.functionality.title")}>
        <p>
          {t.rich("sections.functionality.p1", {
            ...codeTag,
            crispLink: (chunks) => (
              <a
                href="https://help.crisp.chat/en/article/crisp-cookie-policy-1147xor/"
                className="underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t("sections.functionality.p2")}</p>
      </Section>

      <Section title={t("sections.analytics.title")}>
        <p>{t("sections.analytics.body")}</p>
      </Section>

      <Section title={t("sections.targeting.title")}>
        <p>{t("sections.targeting.body")}</p>
      </Section>

      <Section title={t("sections.managing.title")}>
        <p>{t("sections.managing.body")}</p>
      </Section>

      <Section title={t("sections.changes.title")}>
        <p>{t("sections.changes.body", { email: SUPPORT_EMAIL })}</p>
      </Section>
    </main>
  );
}
