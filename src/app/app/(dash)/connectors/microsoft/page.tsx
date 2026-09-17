import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { getTranslations as getTranslationsType } from "next-intl/server";

import { ConnectPoller } from "~/components/workspace/ConnectPoller";
import {
  MicrosoftByoForm,
  MicrosoftDisconnectButton,
} from "~/components/workspace/MicrosoftConnectForm";
import { byoConnectorEnabled, env } from "~/env";
import { ButtonAnchor, ButtonLink, Card } from "~/components/ui";
import { connectErrorText } from "~/lib/connectErrors";
import { MICROSOFT_CONNECTOR } from "~/lib/connectors";
import { CONNECTOR_SCOPES } from "~/lib/scopes";
import { fmtDate } from "~/lib/format";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { msConnections } from "~/server/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectorsDash");
  return { title: t("titles.microsoft") };
}
// BYO connect action syncs in after(); same 300s budget as other sync paths.
export const maxDuration = 300;

type T = Awaited<ReturnType<typeof getTranslationsType<"connectorsDash.microsoft">>>;

/** Required application permissions, the single source of truth for both paths. */
const ScopeList = () => (
  <ul className="border-line bg-card border">
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
);

/**
 * Managed one-click (default) + BYO (Advanced) + the two no-consent fallbacks
 * (instant scan, CSV). Managed needs the central connector app; the scan needs
 * the Entra sign-in app — each is shown only when its env is configured so no
 * option dead-ends.
 */
const SetupOptions = ({
  t,
  byoEnabled,
  connectorConfigured,
  scanConfigured,
}: {
  t: T;
  byoEnabled: boolean;
  connectorConfigured: boolean;
  scanConfigured: boolean;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3">
      <p className="text-ink-soft text-sm">{MICROSOFT_CONNECTOR.managedHint}</p>
      <ScopeList />
      {connectorConfigured ? (
        <div>
          <ButtonAnchor href="/api/connect/start" variant="primary">
            {t("grantConsent")}
          </ButtonAnchor>
        </div>
      ) : (
        <p className="text-ink-soft text-sm">{t("oneClickDisabled")}</p>
      )}
      <p className="text-ink-faint text-xs">{t("forwardHint")}</p>
    </div>

    {byoEnabled && (
      <details className="group border-line border-t pt-4">
        <summary className="text-ink-soft hover:text-ink cursor-pointer text-sm font-medium select-none">
          {t("advancedSummary")}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-ink-soft text-sm">
            {MICROSOFT_CONNECTOR.byoHint}{" "}
            <Link
              href="/connectors/microsoft"
              className="hover:text-ink underline underline-offset-4"
            >
              {t("setupGuideLink")}
            </Link>
            .
          </p>
          <MicrosoftByoForm />
        </div>
      </details>
    )}

    {scanConfigured && (
      <div className="border-line border-t pt-4">
        <p className="text-ink text-sm font-medium">
          {t("instantScanTitle")}
        </p>
        <p className="text-ink-soft mt-1 text-sm">
          {t.rich("instantScanBody", {
            strong: (chunks) => (
              <strong className="text-ink">{chunks}</strong>
            ),
          })}
        </p>
        <div className="mt-3">
          <ButtonAnchor href="/api/scan/start">
            {t("runInstantScan")}
          </ButtonAnchor>
        </div>
      </div>
    )}

    <div className="border-line border-t pt-4">
      <p className="text-ink-soft text-sm">{t("csvHint")}</p>
      <div className="mt-3">
        <ButtonLink href="/app/connect/csv">{t("tryCsv")}</ButtonLink>
      </div>
    </div>
  </div>
);

export default async function MicrosoftConnectorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("connectorsDash.microsoft");
  const ctx = await requireAccess("viewer");
  const isAdmin = hasRole(ctx, "admin");
  const sp = await searchParams;
  // Post-consent / post-scan redirects land here with ?status=syncing (poll the
  // first sync) or ?error=<code>.
  const status = typeof sp.status === "string" ? sp.status : null;
  const error = typeof sp.error === "string" ? sp.error : null;

  const conn = await db.query.msConnections.findFirst({
    where: eq(msConnections.tenantId, ctx.tenant.id),
  });
  const byoEnabled = byoConnectorEnabled();
  const connectorConfigured = Boolean(env.CONNECTOR_CLIENT_ID);
  const scanConfigured = Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <nav
          aria-label="Breadcrumb"
          className="text-ink-faint text-xs font-medium tracking-[0.2em] uppercase"
        >
          <Link
            href="/app/connectors"
            className="hover:text-ink underline-offset-4 hover:underline"
          >
            {t("breadcrumbConnectors")}
          </Link>{" "}
          /{" "}
          <span aria-current="page" className="text-ink-soft">
            {t("breadcrumbCurrent")}
          </span>
        </nav>
        <h1 className="font-display mt-2 text-3xl tracking-tight">
          {t("pageTitle")}
        </h1>
      </header>

      {error && (
        <div
          role="alert"
          className="rise rise-2 border-danger-soft bg-danger-soft/50 text-danger-text flex flex-wrap items-center justify-between gap-3 border p-4 text-sm"
        >
          <span>{await connectErrorText(error)}</span>
          <Link
            href="/app/connectors/microsoft"
            className="hover:text-ink shrink-0 text-xs font-medium underline underline-offset-4"
          >
            {t("dismiss")}
          </Link>
        </div>
      )}

      {status === "syncing" && (
        <div className="rise rise-2">
          <Card title={t("tenantConnected")}>
            <ConnectPoller />
          </Card>
        </div>
      )}

      <div className="rise rise-3 flex flex-col gap-6">
        <Card title={t("connectionCardTitle")}>
          {ctx.tenant.isDemo ? (
            <div className="flex flex-col gap-4">
              <p className="text-ink-soft text-sm">{t("demoBody")}</p>
              <details className="border-line border-t pt-3">
                <summary className="text-ink-soft hover:text-ink inline-flex min-h-11 cursor-pointer touch-manipulation items-center text-sm font-medium">
                  {t("previewConsent")}
                </summary>
                <div className="mt-2 flex flex-col gap-3">
                  <p className="text-ink-soft text-sm">
                    {t("managedFlowNote")}
                  </p>
                  <ScopeList />
                  <Link
                    href="/connectors/microsoft"
                    className="text-ink hover:text-brand-text inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
                  >
                    {t("openSetupGuide")}
                  </Link>
                </div>
              </details>
            </div>
          ) : conn ? (
            <div className="flex flex-col gap-4">
              {(() => {
                // Credential health: a hard auth error takes priority, then a
                // near/past expiry warning (BYO only). Managed has no stored
                // credential to expire.
                const DAY = 24 * 60 * 60 * 1000;
                const expMs = conn.secretExpiresAt
                  ? new Date(conn.secretExpiresAt).getTime() - Date.now()
                  : null;
                if (conn.lastVerifyError) {
                  return (
                    <div className="border-danger-soft bg-danger-soft/50 text-danger-text border p-3 text-sm">
                      {conn.lastVerifyError}
                    </div>
                  );
                }
                if (conn.mode === "byo" && expMs !== null && expMs <= 0) {
                  return (
                    <div className="border-danger-soft bg-danger-soft/50 text-danger-text border p-3 text-sm">
                      {t("credentialExpired", {
                        date: fmtDate(conn.secretExpiresAt),
                      })}
                    </div>
                  );
                }
                if (
                  conn.mode === "byo" &&
                  expMs !== null &&
                  expMs <= 14 * DAY
                ) {
                  return (
                    <div className="border-waste-soft bg-waste-soft/50 text-waste-text border p-3 text-sm">
                      {t("credentialExpiring", {
                        date: fmtDate(conn.secretExpiresAt),
                      })}
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm">
                  <div className="font-medium">
                    {t("connectedLabel")}
                    {conn.mode === "managed"
                      ? t("connectedManaged")
                      : conn.credType === "cert"
                        ? t("connectedByoCert")
                        : t("connectedByoSecret")}
                  </div>
                  <div className="text-ink-soft mt-0.5 text-xs">
                    {t("tenantLabel")}{" "}
                    <span className="font-mono">{conn.tid}</span>
                    {conn.appClientId && (
                      <>
                        {" "}
                        · {t("appLabel")}{" "}
                        <span className="font-mono">{conn.appClientId}</span>
                      </>
                    )}
                  </div>
                  {conn.mode === "byo" && (
                    <div className="text-ink-soft mt-0.5 text-xs">
                      {conn.credType === "cert" && conn.certThumbprint && (
                        <>
                          {t("thumbprintLabel")}{" "}
                          <span className="font-mono">
                            {conn.certThumbprint.slice(0, 16)}…
                          </span>{" "}
                          ·{" "}
                        </>
                      )}
                      {conn.secretExpiresAt
                        ? t("expiresLabel", {
                            date: fmtDate(conn.secretExpiresAt),
                          })
                        : t("noExpiryLabel")}
                      {conn.lastVerifiedAt && (
                        <>
                          {" "}
                          ·{" "}
                          {t("verifiedLabel", {
                            date: fmtDate(conn.lastVerifiedAt),
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && <MicrosoftDisconnectButton />}
              </div>

              {isAdmin && byoEnabled && (
                <details className="group border-line border-t pt-4">
                  <summary className="text-ink-soft hover:text-ink cursor-pointer text-sm font-medium select-none">
                    {conn.mode === "managed"
                      ? t("switchToByo")
                      : t("updateCredentials")}
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
                    {conn.mode === "managed" && (
                      <p className="text-ink-soft text-sm">
                        {MICROSOFT_CONNECTOR.byoHint}
                      </p>
                    )}
                    <MicrosoftByoForm />
                  </div>
                </details>
              )}
            </div>
          ) : isAdmin ? (
            <SetupOptions
              t={t}
              byoEnabled={byoEnabled}
              connectorConfigured={connectorConfigured}
              scanConfigured={scanConfigured}
            />
          ) : (
            <p className="text-ink-soft text-sm">{t("notConnectedViewer")}</p>
          )}
        </Card>

        <Card title={t("whatItDetectsTitle")}>
          <ul className="text-ink-soft flex flex-col gap-2 text-sm">
            {MICROSOFT_CONNECTOR.detects.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true" className="text-brand-text mt-0.5">
                  ·
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="text-ink-faint mt-3 text-xs">
            {t.rich("readOnlyNote", {
              link: (chunks) => (
                <Link
                  href="/security"
                  className="hover:text-ink underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </Card>
      </div>
    </div>
  );
}
