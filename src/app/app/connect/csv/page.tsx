import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAccessContext, requireSession } from "~/server/access";
import { CsvImportForm } from "./CsvImportForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return {
    title: t("csv.meta.title"),
    robots: { index: false, follow: false },
  };
}
// The submit action parses, bulk-writes and runs the rules engine before
// redirecting; give it the same budget as the other sync paths.
export const maxDuration = 300;

/**
 * Zero-consent entry point: any signed-in user turns two admin-center exports
 * into a waste dashboard. Producing the exports needs Reports Reader or Global
 * Reader rights only. Standalone (outside the dash layout) so it is reachable
 * even by an entra-mode user who has no workspace yet.
 */
export default async function CsvImportPage() {
  const t = await getTranslations("connect.csv");
  const session = await requireSession();
  // Users without a workspace can't reach /app/settings/* (it bounces to
  // /app/connect); point them there instead so the link doesn't dead-end.
  const ctx = await getAccessContext();
  const connectHref = ctx ? "/app/connectors/microsoft" : "/app/connect";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-xl tracking-tight">
        License<span className="text-brand-text">Meter</span>
      </Link>

      <h1 className="font-display mt-10 text-4xl tracking-tight">
        {t("title")}
      </h1>

      <p className="text-ink-soft mt-4">
        {t.rich("description", {
          strong: (chunks) => <strong className="text-ink">{chunks}</strong>,
        })}
      </p>

      <div className="border-line bg-card text-ink-soft mt-6 border p-4 text-xs">
        <p className="text-ink-faint font-medium tracking-wide uppercase">
          {t("dataHandling.heading")}
        </p>
        <p className="mt-2">{t("dataHandling.body")}</p>
      </div>

      <CsvImportForm />

      <p className="text-ink-faint mt-8 text-xs">
        {t("haveConsent")}{" "}
        <Link
          href={connectHref}
          className="text-ink hover:text-brand-text font-medium underline underline-offset-4"
        >
          {t("connectInstead")}
        </Link>{" "}
        {t("connectInsteadSuffix")}
      </p>

      <p className="text-ink-faint mt-3 text-xs">
        {t("signedInAs", {
          identity: session.user.upn ?? session.user.email ?? "",
        })}
      </p>
    </main>
  );
}
