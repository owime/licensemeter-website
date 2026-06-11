import Link from "next/link";
import { redirect } from "next/navigation";

import { ConnectPoller } from "~/components/workspace/ConnectPoller";
import { getAccessContext, requireSession } from "~/server/access";

const ERROR_TEXT: Record<string, string> = {
  not_configured:
    "The connector app registration is not configured on this deployment (CONNECTOR_CLIENT_ID missing).",
  missing_state: "The consent response was missing its state value. Please retry.",
  invalid_state: "This consent link was already used or is unknown. Please retry.",
  expired_state: "The consent link expired (15 minutes). Please retry.",
  consent_declined: "Consent was declined in the Microsoft dialog.",
  consent_incomplete: "Microsoft did not confirm the consent. Please retry.",
  tenant_mismatch:
    "Consent was granted for a different tenant than the one you signed in from. Sign in with an account from the tenant you want to connect, then retry.",
};

const SCOPES = [
  ["User.Read.All", "directory users, enabled state, assigned licenses"],
  ["AuditLog.Read.All", "last sign-in timestamps (needs Entra ID P1)"],
  ["Reports.Read.All", "usage and Copilot activity reports"],
  ["LicenseAssignment.Read.All", "purchased vs assigned seat counts"],
  ["ReportSettings.Read.All", "whether report names are concealed"],
] as const;

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const ctx = await getAccessContext();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : null;
  const error = typeof sp.error === "string" ? sp.error : null;

  // Already connected and syncing finished -> straight to the dashboard.
  if (ctx && status !== "syncing") redirect("/app");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-xl tracking-tight">
        License<span className="text-rust">Meter</span>
      </Link>

      <h1 className="mt-10 font-display text-4xl tracking-tight">
        {status === "syncing" ? "Tenant connected." : "Connect your tenant"}
      </h1>

      {error && (
        <div className="mt-6 border border-rust-soft bg-rust-soft/50 p-4 text-sm text-rust-deep">
          {ERROR_TEXT[error] ?? "Something went wrong. Please retry."}
        </div>
      )}

      {status === "syncing" ? (
        <div className="mt-6">
          <ConnectPoller />
        </div>
      ) : (
        <>
          <p className="mt-4 text-ink-soft">
            A Global Administrator of your Microsoft 365 tenant grants
            LicenseMeter <strong className="text-ink">read-only</strong>{" "}
            application permissions once. Nothing is ever written to your
            tenant, and mailbox or file contents are never readable.
          </p>

          <ul className="mt-6 border border-line bg-card">
            {SCOPES.map(([scope, why]) => (
              <li
                key={scope}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <code className="font-mono text-xs">{scope}</code>
                <span className="text-xs text-ink-soft">{why}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4">
            {session.user.isDemo ? (
              <Link
                href="/app"
                className="bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-rust-deep"
              >
                Back to the demo workspace
              </Link>
            ) : (
              <a
                href="/api/connect/start"
                className="bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-rust-deep"
              >
                Grant admin consent
              </a>
            )}
            <span className="text-xs text-ink-faint">
              Signed in as {session.user.upn || session.user.email}
            </span>
          </div>

          {!session.user.isDemo && (
            <p className="mt-6 text-xs text-ink-faint">
              Not a Global Admin? Forward this page to one — after consent, you
              become the workspace owner and can invite finance colleagues as
              viewers.
            </p>
          )}
        </>
      )}
    </main>
  );
}
