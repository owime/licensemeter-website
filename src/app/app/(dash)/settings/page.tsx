import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CurrencySelect } from "~/components/workspace/CurrencySelect";
import { DangerZone } from "~/components/workspace/DangerZone";
import { InactiveDaysForm } from "~/components/workspace/InactiveDaysForm";
import { InviteForm } from "~/components/workspace/InviteForm";
import { LeakAlertsToggle } from "~/components/workspace/LeakAlertsToggle";
import { MemberActions } from "~/components/workspace/MemberActions";
import { MonthlyReportToggle } from "~/components/workspace/MonthlyReportToggle";
import { ReplayTourButton } from "~/components/workspace/ReplayTourButton";
import { RoleSelect } from "~/components/workspace/RoleSelect";
import { Card, Pill } from "~/components/ui";
import { fmtDate, fmtDateTime, workspaceLabel } from "~/lib/format";
import { ROLE_DESCRIPTION } from "~/lib/roles";
import { hasRole, inviteExpiry, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { auditLog, memberships, syncRuns } from "~/server/db/schema";
import { emailEnabled } from "~/server/email";
import { auditActionLabel, syncStepLabel } from "~/lib/activityLabels";

const Capability = ({
  ok,
  label,
  okText,
  warnText,
  hint,
  unknownText,
}: {
  ok: boolean | null;
  label: string;
  okText: string;
  warnText: string;
  hint?: string;
  unknownText: string;
}) => (
  <div className="flex items-start gap-3 py-2">
    <span
      aria-hidden="true"
      className={`mt-1 inline-block size-2 shrink-0 rounded-full ${
        ok === null ? "bg-line-strong" : ok ? "bg-moss" : "bg-gold"
      }`}
    />
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-ink-soft text-sm">
        {ok === null ? unknownText : ok ? okText : warnText}
      </div>
      {ok === false && hint && (
        <div className="text-ink-faint mt-1 max-w-xl text-xs">{hint}</div>
      )}
    </div>
  </div>
);

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const ta = await getTranslations("settings.activity");
  const ctx = await requireAccess("viewer");
  const isAdmin = hasRole(ctx, "admin");
  const isOwner = hasRole(ctx, "owner");
  // Workspace settings are read-only in the shared demo: an admin role there is
  // granted to every visitor, so editable controls would mutate shared state.
  const canEdit = isAdmin && !ctx.tenant.isDemo;
  const inviteEmailsActive = emailEnabled() && !ctx.tenant.isDemo;

  const [members, runs, activity] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <h1 className="font-display text-3xl tracking-tight">{t("title")}</h1>
      </header>

      <div className="rise rise-2 flex flex-col gap-6">
        <Card title={t("workspace.title")}>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-faint">{t("workspace.organization")}</dt>
              <dd className="mt-0.5 font-medium">
                {ctx.tenant.name ?? t("workspace.unknown")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">{t("workspace.tenantId")}</dt>
              <dd className="mt-0.5 font-mono text-xs">
                {ctx.tenant.tid ?? t("workspace.notConnected")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">{t("workspace.connectedSince")}</dt>
              <dd className="mt-0.5">
                {!ctx.tenant.consentedAt && !ctx.tenant.isDemo
                  ? t("workspace.importedNotConnected")
                  : fmtDate(ctx.tenant.consentedAt)}
              </dd>
            </div>
            <div className="border-line mt-2 border-t pt-4 sm:col-span-2">
              <h3 className="text-ink-faint text-[11px] font-medium tracking-[0.16em] uppercase">
                {t("workspace.dataDetection")}
              </h3>
            </div>
            <div>
              <dt className="text-ink-faint">{t("workspace.currency")}</dt>
              <dd className="mt-0.5">
                {canEdit ? (
                  <CurrencySelect value={ctx.tenant.currency} />
                ) : (
                  ctx.tenant.currency
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">
                {t("workspace.inactivityThreshold")}
              </dt>
              <dd className="mt-0.5">
                {canEdit ? (
                  <InactiveDaysForm value={ctx.tenant.inactiveDays} />
                ) : (
                  t("workspace.days", { days: ctx.tenant.inactiveDays })
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">
                {t("workspace.contractRenewals")}
              </dt>
              <dd className="mt-0.5">
                <Link
                  href="/app/renewals"
                  className="hover:text-ink underline underline-offset-4"
                >
                  {t("workspace.manageRenewalCalendar")}
                </Link>
              </dd>
            </div>
            <div className="border-line mt-2 border-t pt-4 sm:col-span-2">
              <h3 className="text-ink-faint text-[11px] font-medium tracking-[0.16em] uppercase">
                {t("workspace.notificationsHeading")}
              </h3>
            </div>
            <div>
              <dt className="text-ink-faint">
                {t("workspace.leakAlertEmails")}
              </dt>
              <dd className="mt-0.5">
                {canEdit ? (
                  <LeakAlertsToggle initial={ctx.tenant.leakAlerts} />
                ) : ctx.tenant.leakAlerts ? (
                  t("workspace.on")
                ) : (
                  t("workspace.off")
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">
                {t("workspace.monthlyPdfReport")}
              </dt>
              <dd className="mt-0.5">
                {canEdit ? (
                  <MonthlyReportToggle initial={ctx.tenant.monthlyReport} />
                ) : ctx.tenant.monthlyReport ? (
                  t("workspace.on")
                ) : (
                  t("workspace.off")
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">{t("workspace.productTour")}</dt>
              <dd className="mt-0.5">
                <ReplayTourButton storageId={ctx.membership.id} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card title={t("detection.title")}>
          <Capability
            ok={ctx.tenant.hasP1}
            label={t("detection.entraP1.label")}
            okText={t("detection.entraP1.ok")}
            warnText={t("detection.entraP1.warn")}
            hint={t("detection.entraP1.hint")}
            unknownText={t("detection.unknown")}
          />
          <Capability
            ok={
              ctx.tenant.concealedNames === null
                ? null
                : !ctx.tenant.concealedNames
            }
            label={t("detection.identifiableUsage.label")}
            okText={t("detection.identifiableUsage.ok")}
            warnText={t("detection.identifiableUsage.warn")}
            hint={t("detection.identifiableUsage.hint")}
            unknownText={t("detection.unknown")}
          />
          <Capability
            ok={
              ctx.tenant.copilotSignal === null
                ? null
                : ctx.tenant.copilotSignal !== "none"
            }
            label={t("detection.copilotUsage.label")}
            okText={t("detection.copilotUsage.ok")}
            warnText={t("detection.copilotUsage.warn")}
            unknownText={t("detection.unknown")}
          />
        </Card>

        <Card title={t("syncHistoryCard.title")}>
          {runs.length === 0 ? (
            <p className="text-ink-soft text-sm">
              {t("syncHistoryCard.noSyncs")}
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="border-line flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`inline-block size-2 rounded-full ${
                          run.status === "success"
                            ? "bg-moss"
                            : run.status === "running"
                              ? "bg-gold motion-safe:animate-pulse"
                              : run.status === "partial"
                                ? "bg-gold"
                                : "bg-danger"
                        }`}
                      />
                      <span className="font-medium capitalize">
                        {run.status}
                      </span>
                      <span className="text-ink-faint">
                        {fmtDateTime(run.startedAt)}
                      </span>
                    </div>
                    <div className="text-ink-soft min-w-0 font-mono text-[11px] break-words">
                      {run.steps
                        .map(
                          (s) =>
                            `${syncStepLabel(ta, s.step)}${s.count !== undefined ? `: ${s.count}` : ""}${
                              s.status === "ok" ? "" : ` · ${s.status}`
                            }`,
                        )
                        .join(" · ") ||
                        (run.error ?? "")}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-right">
                <Link
                  href="/app/settings/sync-history"
                  className="text-ink hover:text-brand-text text-xs font-medium underline-offset-4 hover:underline"
                >
                  {t("syncHistoryCard.viewAll")}
                </Link>
              </div>
            </>
          )}
        </Card>

        <Card title={t("members.title")}>
          <ul className="flex flex-col">
            {members.map((m) => (
              <li
                key={m.id}
                className="border-line flex items-center justify-between gap-3 border-b py-2.5 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {m.name ?? m.email}
                    {m.id === ctx.membership.id && (
                      <span className="text-ink-faint ml-2 text-xs">
                        {t("members.you")}
                      </span>
                    )}
                  </div>
                  <div className="text-ink-faint truncate text-xs">
                    {m.email}
                    {!m.oid &&
                      (inviteExpiry(m.createdAt) < new Date()
                        ? ` · ${t("members.inviteExpired")}`
                        : ` · ${t("members.invitedExpires", { date: fmtDate(inviteExpiry(m.createdAt)) })}`)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {isAdmin &&
                  !ctx.tenant.isDemo &&
                  m.id !== ctx.membership.id &&
                  (m.role !== "owner" || isOwner) ? (
                    <RoleSelect
                      membershipId={m.id}
                      role={m.role}
                      allowOwner={isOwner}
                    />
                  ) : (
                    <Pill tone="slate" title={ROLE_DESCRIPTION[m.role]}>
                      {m.role}
                    </Pill>
                  )}
                  {isAdmin && !ctx.tenant.isDemo && (
                    <MemberActions
                      membershipId={m.id}
                      canResend={!m.oid}
                      canRemove={m.id !== ctx.membership.id}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isAdmin && !ctx.tenant.isDemo && (
            <InviteForm
              allowOwner={isOwner}
              inviteEmailsActive={inviteEmailsActive}
            />
          )}
          {ctx.tenant.isDemo && (
            <p className="text-ink-faint mt-3 text-xs">
              {t("members.demoFixed")}
            </p>
          )}
        </Card>

        {isAdmin && (
          <Card title={t("activity.title")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-soft text-sm">
                {t("activity.recentChanges")}
              </p>
              <div className="flex gap-3 text-xs">
                <Link
                  href="/app/settings/activity"
                  className="hover:text-ink underline"
                >
                  {t("activity.fullLog")}
                </Link>
                <a
                  href="/api/export/audit"
                  className="hover:text-ink underline"
                >
                  {t("activity.exportCsv")}
                </a>
              </div>
            </div>
            {activity.length === 0 ? (
              <p className="text-ink-soft text-sm">
                {t("activity.noActivity")}
              </p>
            ) : (
              <ul className="flex flex-col">
                {activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-line flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2 text-sm last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">
                        {auditActionLabel(ta, entry.action)}
                      </span>
                      <span className="text-ink-faint ml-2 text-xs break-all">
                        {entry.actorEmail ?? entry.actorOid}
                      </span>
                    </span>
                    <span className="text-ink-faint font-mono text-[11px] whitespace-nowrap">
                      {fmtDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-ink-faint mt-3 text-xs">
              {t("activity.footerNote")}
            </p>
          </Card>
        )}

        {isOwner && !ctx.tenant.isDemo && (
          <DangerZone tenantName={workspaceLabel(ctx.tenant)} />
        )}
        {ctx.tenant.isDemo && (
          <p className="text-ink-faint text-xs">{t("demoNotice")}</p>
        )}
      </div>
    </div>
  );
}
