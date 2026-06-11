import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { CurrencySelect } from "~/components/workspace/CurrencySelect";
import { DangerZone } from "~/components/workspace/DangerZone";
import { Button, Card, Pill } from "~/components/ui";
import { fmtDate } from "~/lib/format";
import { hasRole, inviteExpiry, requireAccess } from "~/server/access";
import {
  addMember,
  removeMember,
  resendInvite,
  setInactiveDays,
} from "~/server/actions";
import { db } from "~/server/db";
import {
  adobeConnections,
  auditLog,
  memberships,
  syncRuns,
} from "~/server/db/schema";
import { emailEnabled } from "~/server/email";

const Capability = ({
  ok,
  label,
  okText,
  warnText,
  hint,
}: {
  ok: boolean | null;
  label: string;
  okText: string;
  warnText: string;
  hint?: string;
}) => (
  <div className="flex items-start gap-3 py-2">
    <span
      className={`mt-1 inline-block size-2 shrink-0 rounded-full ${
        ok === null ? "bg-line-strong" : ok ? "bg-moss" : "bg-gold"
      }`}
    />
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-sm text-ink-soft">
        {ok === null ? "Unknown — run a sync" : ok ? okText : warnText}
      </div>
      {ok === false && hint && (
        <div className="mt-1 max-w-xl text-xs text-ink-faint">{hint}</div>
      )}
    </div>
  </div>
);

export default async function SettingsPage() {
  const ctx = await requireAccess("viewer");
  const isAdmin = hasRole(ctx, "admin");
  const isOwner = hasRole(ctx, "owner");
  const inviteEmailsActive = emailEnabled() && !ctx.tenant.isDemo;

  const [members, runs, activity, adobeConn] = await Promise.all([
    db.query.memberships.findMany({
      where: eq(memberships.tenantId, ctx.tenant.id),
    }),
    db.query.syncRuns.findMany({
      where: eq(syncRuns.tenantId, ctx.tenant.id),
      orderBy: desc(syncRuns.startedAt),
      limit: 8,
    }),
    isAdmin
      ? db.query.auditLog.findMany({
          where: eq(auditLog.tenantId, ctx.tenant.id),
          orderBy: desc(auditLog.createdAt),
          limit: 30,
        })
      : Promise.resolve([]),
    db.query.adobeConnections.findFirst({
      where: eq(adobeConnections.tenantId, ctx.tenant.id),
    }),
  ]);

  const adobeStatus = ctx.tenant.isDemo
    ? "Connected with demo data"
    : adobeConn
      ? "Connected"
      : "Not connected";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <h1 className="font-display text-3xl tracking-tight">Settings</h1>
      </header>

      <div className="rise rise-2 flex flex-col gap-6">
        <Card title="Workspace">
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-faint">Organization</dt>
              <dd className="mt-0.5 font-medium">
                {ctx.tenant.name ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Tenant ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{ctx.tenant.tid}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Connected since</dt>
              <dd className="mt-0.5">{fmtDate(ctx.tenant.consentedAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Currency</dt>
              <dd className="mt-0.5">
                {isAdmin ? (
                  <CurrencySelect value={ctx.tenant.currency} />
                ) : (
                  ctx.tenant.currency
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Inactivity threshold</dt>
              <dd className="mt-0.5">
                {isAdmin ? (
                  <form
                    action={async (formData) => {
                      "use server";
                      await setInactiveDays(formData);
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="days"
                      defaultValue={String(ctx.tenant.inactiveDays)}
                      aria-label="Inactivity threshold in days"
                      className="border border-line bg-card px-2 py-1.5 text-sm focus:border-ink"
                    >
                      {[30, 60, 90, 120, 180].map((d) => (
                        <option key={d} value={d}>
                          {d} days
                        </option>
                      ))}
                    </select>
                    <Button variant="micro" className="py-1.5">
                      Save
                    </Button>
                  </form>
                ) : (
                  `${ctx.tenant.inactiveDays} days`
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Detection capabilities">
          <Capability
            ok={ctx.tenant.hasP1}
            label="Entra ID P1 sign-in activity"
            okText="Per-user last sign-in is available."
            warnText="No Entra ID P1/P2 — falling back to usage-report activity."
            hint="Without P1, inactivity detection uses workload reports only, which is slightly less precise."
          />
          <Capability
            ok={ctx.tenant.concealedNames === null ? null : !ctx.tenant.concealedNames}
            label="Identifiable usage reports"
            okText="Usage reports include user names — per-user findings enabled."
            warnText="Report names are concealed (Microsoft default since 2021); usage-based findings are aggregate only."
            hint="A Global Admin can change this in Microsoft 365 admin center > Settings > Org settings > Reports (the change is audit-logged)."
          />
          <Capability
            ok={
              ctx.tenant.copilotSignal === null
                ? null
                : ctx.tenant.copilotSignal !== "none"
            }
            label="Copilot usage data"
            okText="Copilot usage report is readable."
            warnText="No Copilot usage data found (no Copilot licenses, or the report is unavailable)."
          />
        </Card>

        <Card title="Sync history">
          {runs.length === 0 ? (
            <p className="text-sm text-ink-soft">No syncs yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {runs.map((run) => (
                <li
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        run.status === "success"
                          ? "bg-moss"
                          : run.status === "running"
                            ? "animate-pulse bg-gold"
                            : run.status === "partial"
                              ? "bg-gold"
                              : "bg-rust"
                      }`}
                    />
                    <span className="font-medium capitalize">{run.status}</span>
                    <span className="text-ink-faint">
                      {fmtDate(run.startedAt)}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-ink-soft">
                    {run.steps
                      .map(
                        (s) =>
                          `${s.step}${s.count !== undefined ? `:${s.count}` : ""}${
                            s.status === "ok" ? "" : ` (${s.status})`
                          }`,
                      )
                      .join(" · ") || (run.error ?? "")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Members">
          <ul className="flex flex-col">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {m.name ?? m.email}
                    {m.id === ctx.membership.id && (
                      <span className="ml-2 text-xs text-ink-faint">(you)</span>
                    )}
                  </div>
                  <div className="truncate text-xs text-ink-faint">
                    {m.email}
                    {!m.oid &&
                      (inviteExpiry(m.createdAt) < new Date()
                        ? " · invite expired"
                        : ` · invited, expires ${fmtDate(inviteExpiry(m.createdAt))}`)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Pill tone="slate">{m.role}</Pill>
                  {isAdmin && !m.oid && (
                    <form
                      action={async () => {
                        "use server";
                        await resendInvite(m.id);
                      }}
                    >
                      <button className="text-xs text-ink-faint underline-offset-4 hover:text-ink hover:underline">
                        Resend
                      </button>
                    </form>
                  )}
                  {isAdmin && m.id !== ctx.membership.id && (
                    <form
                      action={async () => {
                        "use server";
                        await removeMember(m.id);
                      }}
                    >
                      <button className="text-xs text-ink-faint underline-offset-4 hover:text-rust-text hover:underline">
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <form
              action={async (formData) => {
                "use server";
                await addMember(formData);
              }}
              className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@yourcompany.com"
                className="min-w-56 flex-1 border border-line bg-card px-3 py-2 text-sm focus:border-ink"
              />
              <select
                name="role"
                defaultValue="viewer"
                aria-label="Role for the invited member"
                className="border border-line bg-card px-2 py-2 text-sm focus:border-ink"
              >
                <option value="viewer">Viewer (finance)</option>
                <option value="admin">Admin</option>
                {isOwner && <option value="owner">Owner</option>}
              </select>
              <Button variant="primary" className="px-4 py-2">
                Invite
              </Button>
              <p className="w-full text-xs text-ink-faint">
                {inviteEmailsActive
                  ? "Invited people get an email with a sign-in link and gain access on their first Microsoft sign-in."
                  : "Invited people get access when they first sign in with Microsoft using this email."}{" "}
                Same-tenant sign-in alone never grants access.
              </p>
            </form>
          )}
        </Card>

        <Card title="Connectors">
          <ul className="flex flex-col">
            <li className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium">Adobe</span>
                <Pill tone="gold">Beta</Pill>
                <span className="text-ink-soft">{adobeStatus}</span>
              </div>
              <Link
                href="/app/settings/adobe"
                className="text-xs font-medium text-ink underline-offset-4 hover:text-rust-text hover:underline"
              >
                {!isAdmin
                  ? "View →"
                  : adobeConn || ctx.tenant.isDemo
                    ? "Manage →"
                    : "Configure →"}
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            Each connector has its own page under Settings. More connectors
            are on the way.
          </p>
        </Card>

        {isAdmin && (
          <Card title="Activity">
            {activity.length === 0 ? (
              <p className="text-sm text-ink-soft">No activity recorded yet.</p>
            ) : (
              <ul className="flex flex-col">
                {activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-line py-2 text-sm last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">
                        {entry.action.replaceAll("_", " ")}
                      </span>
                      <span className="ml-2 truncate text-xs text-ink-faint">
                        {entry.actorEmail ?? entry.actorOid}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] whitespace-nowrap text-ink-faint">
                      {fmtDate(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-faint">
              Exports, price changes, membership and sync actions — kept with
              the workspace, deleted with it.
            </p>
          </Card>
        )}

        {isOwner && !ctx.tenant.isDemo && (
          <DangerZone tenantName={ctx.tenant.name ?? ctx.tenant.tid} />
        )}
        {ctx.tenant.isDemo && (
          <p className="text-xs text-ink-faint">
            This is the demo workspace — synthetic data, refreshed on every
            sync. Connect a real tenant from a Microsoft sign-in to see your
            own numbers.
          </p>
        )}
      </div>
    </div>
  );
}
