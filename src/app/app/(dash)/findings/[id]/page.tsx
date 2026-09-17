import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Pill } from "~/components/ui";
import { FindingChip } from "~/components/workspace/FindingChip";
import { FindingStatusControl } from "~/components/workspace/FindingStatusControl";
import { FindingWorkflowForm } from "~/components/workspace/FindingWorkflowForm";
import { fmtDate, fmtMoney } from "~/lib/format";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { findings, memberships } from "~/server/db/schema";

export const metadata: Metadata = { title: "Finding workflow" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TECHNICAL_DETAIL_KEYS = new Set([
  "aggregate",
  "skuId",
  "skuPartNumber",
  "redundantSkuIds",
]);

const formatDetailValue = (
  key: string,
  value: unknown,
  t: Awaited<ReturnType<typeof getTranslations<"findings.detail">>>,
) => {
  if (typeof value === "number") {
    return key.endsWith("Days")
      ? t("daysSuffix", { value })
      : String(value);
  }
  if (typeof value === "string") {
    if (key.toLowerCase().includes("activity")) return fmtDate(value);
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as Record<string, unknown>;
          if (typeof row.name === "string") return row.name;
          if (
            typeof row.suite === "string" &&
            typeof row.redundant === "string"
          ) {
            return t("isAlreadyCoveredBy", {
              redundant: row.redundant,
              suite: row.suite,
            });
          }
          return JSON.stringify(row);
        }
        return String(item);
      })
      .join(", ");
  }
  return JSON.stringify(value);
};

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAccess("viewer");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const t = await getTranslations("findings.detail");
  const tStatus = await getTranslations("findings.status");
  const tWorkflow = await getTranslations("findings.workflow");
  const DETAIL_LABELS: Record<string, string> = {
    upn: t("fields.upn"),
    displayName: t("fields.displayName"),
    lastActivity: t("fields.lastActivity"),
    copilotLastActivity: t("fields.copilotLastActivity"),
    inactiveDays: t("fields.inactiveDays"),
    accountAgeDays: t("fields.accountAgeDays"),
    purchased: t("fields.purchased"),
    assigned: t("fields.assigned"),
    unassigned: t("fields.unassigned"),
    usersWithDisabledPlans: t("fields.usersWithDisabledPlans"),
    inactiveCount: t("fields.inactiveCount"),
    totalCount: t("fields.totalCount"),
    hint: t("fields.hint"),
    pairs: t("fields.pairs"),
    licenses: t("fields.licenses"),
  };
  const workflowLabel: Record<string, string> = {
    unassigned: tWorkflow("unassigned"),
    planned: tWorkflow("planned"),
    requested: tWorkflow("requestedFull"),
    in_progress: tWorkflow("inProgress"),
  };
  const [finding, members] = await Promise.all([
    db.query.findings.findFirst({
      where: and(eq(findings.id, id), eq(findings.tenantId, ctx.tenant.id)),
    }),
    db.query.memberships.findMany({
      where: eq(memberships.tenantId, ctx.tenant.id),
      columns: { id: true, name: true, email: true },
    }),
  ]);
  if (!finding) notFound();
  const assignee = members.find(
    (member) => member.id === finding.assigneeMembershipId,
  );
  const canEdit = hasRole(ctx, "admin") && !ctx.tenant.isDemo;
  const allDetails = Object.entries(finding.detail).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  const details = allDetails.filter(([key]) => !TECHNICAL_DETAIL_KEYS.has(key));
  const technicalDetails = allDetails.filter(([key]) =>
    TECHNICAL_DETAIL_KEYS.has(key),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <nav
          aria-label="Breadcrumb"
          className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase"
        >
          <Link href="/app/findings" className="hover:text-ink hover:underline">
            {t("breadcrumbFindings")}
          </Link>{" "}
          / <span aria-current="page">{t("breadcrumbWorkflow")}</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FindingChip rule={finding.rule} detail={finding.detail} />
              <Pill tone={finding.status === "resolved" ? "moss" : "brand"}>
                {tStatus(finding.status)}
              </Pill>
              <Pill tone="outline">
                {workflowLabel[finding.remediationStatus] ??
                  finding.remediationStatus}
              </Pill>
            </div>
            <h1 className="font-display mt-3 text-3xl tracking-tight text-pretty">
              {finding.title}
            </h1>
          </div>
          <div className="tnum text-waste-text font-display text-3xl">
            {fmtMoney(finding.monthlyImpactCents, ctx.tenant.currency)}/mo
          </div>
        </div>
      </header>

      <section className="rise rise-2 border-line bg-card border p-5">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.16em] uppercase">
          {t("detailsHeading")}
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-faint text-xs">{t("firstSeen")}</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.firstSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-ink-faint text-xs">{t("lastSeen")}</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.lastSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-ink-faint text-xs">{t("assignee")}</dt>
            <dd className="mt-1 text-sm">
              {assignee?.name ?? assignee?.email ?? t("assigneeUnassigned")}
            </dd>
          </div>
          {finding.graphUserId && (
            <div>
              <dt className="text-ink-faint text-xs">
                {t("affectedUser")}
              </dt>
              <dd className="mt-1 text-sm">
                <Link
                  href={`/app/users/${encodeURIComponent(finding.graphUserId)}`}
                  className="hover:text-brand-text font-medium underline underline-offset-4"
                >
                  {t("openUserProfile")}
                </Link>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-ink-faint text-xs">{t("dueDate")}</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.dueDate)}</dd>
          </div>
          {finding.ticketUrl && (
            <div className="sm:col-span-2">
              <dt className="text-ink-faint text-xs">
                {t("externalTicket")}
              </dt>
              <dd className="mt-1 text-sm break-all">
                <a
                  href={finding.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-text underline underline-offset-4"
                >
                  {finding.ticketUrl}
                </a>
              </dd>
            </div>
          )}
          {details.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-ink-faint text-xs">
                {DETAIL_LABELS[key] ?? key.replaceAll("_", " ")}
              </dt>
              <dd className="mt-1 text-sm break-words">
                {formatDetailValue(key, value, t)}
              </dd>
            </div>
          ))}
        </dl>
        {technicalDetails.length > 0 && (
          <details className="border-line mt-5 border-t pt-3">
            <summary className="text-ink-soft hover:text-ink inline-flex min-h-11 cursor-pointer touch-manipulation items-center text-sm font-medium">
              {t("technicalIdentifiers")}
            </summary>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              {technicalDetails.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-ink-faint text-xs">
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd className="mt-1 font-mono text-xs break-words">
                    {formatDetailValue(key, value, t)}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        {finding.workflowNote && (
          <div className="border-line mt-5 border-t pt-4">
            <h3 className="text-ink-faint text-xs font-medium uppercase">
              {t("notes")}
            </h3>
            <p className="text-ink-soft mt-2 text-sm whitespace-pre-wrap">
              {finding.workflowNote}
            </p>
          </div>
        )}
      </section>

      {canEdit && finding.status !== "resolved" && (
        <section className="rise rise-3 border-line bg-card border p-5">
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.16em] uppercase">
            {t("ownershipHeading")}
          </h2>
          <div className="mt-4">
            <FindingWorkflowForm
              findingId={finding.id}
              initial={finding}
              members={members.map((member) => ({
                id: member.id,
                label: member.name
                  ? `${member.name} (${member.email})`
                  : member.email,
              }))}
            />
          </div>
        </section>
      )}

      {ctx.tenant.isDemo && finding.status !== "resolved" && (
        <section className="rise rise-3 border-line bg-card border p-5">
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.16em] uppercase">
            {t("workflowPreviewHeading")}
          </h2>
          <p className="text-ink-soft mt-2 text-sm leading-relaxed">
            {t("workflowPreviewText")}
          </p>
        </section>
      )}

      {canEdit && finding.status !== "resolved" && (
        <section className="rise rise-3 border-line bg-card flex flex-wrap items-center justify-between gap-4 border p-5">
          <div>
            <h2 className="font-medium">{t("detectionStatusHeading")}</h2>
            <p className="text-ink-soft mt-1 text-sm">
              {t("detectionStatusText")}
            </p>
          </div>
          <FindingStatusControl
            findingId={finding.id}
            initial={finding.status}
          />
        </section>
      )}
    </div>
  );
}
