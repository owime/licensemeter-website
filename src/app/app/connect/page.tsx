import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ButtonAnchor, ButtonLink } from "~/components/ui";
import { env } from "~/env";
import { connectErrorText } from "~/lib/connectErrors";
import { CONNECTOR_SCOPES } from "~/lib/scopes";
import { getAccessContext, requireSession } from "~/server/access";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return { title: t("meta.title"), robots: { index: false, follow: false } };
}

/**
 * Standalone connect entry. In the workspace-first model almost every signed-in
 * user already has a workspace, so this redirects them to the in-app Microsoft
 * connector page (chrome, BYO, scan, CSV). It stays a standalone page — outside
 * the (dash) layout, which requires a workspace — only to serve the one case
 * that has none yet: a brand-new entra-mode user completing first admin consent.
 */
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("connect");
  const session = await requireSession();
  const ctx = await getAccessContext();
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  // Has a workspace -> use the in-app connector page (consistent with all other
  // connectors), preserving any error so it isn't lost in the redirect. Only the
  // no-workspace fallback renders below.
  if (ctx) {
    redirect(
      `/app/connectors/microsoft${error ? `?error=${encodeURIComponent(error)}` : ""}`,
    );
  }
  const connectorConfigured = Boolean(env.CONNECTOR_CLIENT_ID);
  const scanConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-xl tracking-tight">
        License<span className="text-brand-text">Meter</span>
      </Link>

      <h1 className="font-display mt-10 text-4xl tracking-tight">
        {t("title")}
      </h1>

      {error && (
        <div
          role="alert"
          className="border-danger-soft bg-danger-soft/50 text-danger-text mt-6 border p-4 text-sm"
        >
          {await connectErrorText(error)}
        </div>
      )}

      <p className="text-ink mt-6 text-sm font-medium">
        {t("readOnlySync")}
      </p>
      <p className="text-ink-soft mt-1">
        {t.rich("description", {
          strong: (chunks) => (
            <strong className="text-ink">{chunks}</strong>
          ),
        })}
      </p>

      <ul className="border-line bg-card mt-6 border">
        {CONNECTOR_SCOPES.map((s) => (
          <li
            key={s.scope}
            className="border-line flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-4 py-2.5 last:border-b-0"
          >
            <code className="font-mono text-xs">{s.scope}</code>
            <span className="text-ink-soft text-xs">{s.why}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {connectorConfigured ? (
          <ButtonAnchor href="/api/connect/start" variant="primary">
            {t("grantConsent")}
          </ButtonAnchor>
        ) : (
          <span className="text-ink-soft text-sm">
            {t("consentNotEnabled")}
          </span>
        )}
        <span className="text-ink-faint text-xs">
          {t("signedInAs", {
            identity: session.user.upn ?? session.user.email ?? "",
          })}
        </span>
      </div>

      {scanConfigured && (
        <div className="border-line bg-card mt-8 border p-4">
          <p className="text-ink text-sm font-medium">
            {t("instantScan.title")}
          </p>
          <p className="text-ink-soft mt-1 text-sm">
            {t.rich("instantScan.description", {
              strong: (chunks) => (
                <strong className="text-ink">{chunks}</strong>
              ),
            })}
          </p>
          <div className="mt-3">
            <ButtonAnchor href="/api/scan/start">
              {t("instantScan.cta")}
            </ButtonAnchor>
          </div>
        </div>
      )}

      <div className="border-line bg-card mt-4 border p-4">
        <p className="text-ink-soft text-sm">{t("noAdmin.description")}</p>
        <div className="mt-3">
          <ButtonLink href="/app/connect/csv">{t("noAdmin.cta")}</ButtonLink>
        </div>
      </div>
    </main>
  );
}
