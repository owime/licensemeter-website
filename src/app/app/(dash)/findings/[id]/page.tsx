import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Pill } from "~/components/ui";
import { FindingChip } from "~/components/workspace/FindingChip";
import { FindingStatusControl } from "~/components/workspace/FindingStatusControl";
import { FindingWorkflowForm } from "~/components/workspace/FindingWorkflowForm";
import { fmtDate, fmtMoney } from "~/lib/format";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { findings, memberships } from "~/server/db/schema";

export const metadata: Metadata = { title: "Finding workflow" };

const workflowLabel: Record<string, string> = {
  unassigned: "Not planned",
  planned: "Planned",
  requested: "Remediation requested",
  in_progress: "In progress",
};

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAccess("viewer");
  const { id } = await params;
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
  const canEdit =
    hasRole(ctx, "admin") && !ctx.tenant.isDemo && ctx.entitlement.active;
  const details = Object.entries(finding.detail).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <nav
          aria-label="Breadcrumb"
          className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase"
        >
          <Link href="/app/findings" className="hover:text-ink hover:underline">
            Findings
          </Link>{" "}
          / <span aria-current="page">Workflow</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FindingChip rule={finding.rule} detail={finding.detail} />
              <Pill tone={finding.status === "resolved" ? "moss" : "brand"}>
                {finding.status}
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
          Finding details
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-faint text-xs">First seen</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.firstSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-ink-faint text-xs">Last seen</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.lastSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-ink-faint text-xs">Assignee</dt>
            <dd className="mt-1 text-sm">
              {assignee?.name ?? assignee?.email ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-faint text-xs">Due date</dt>
            <dd className="mt-1 text-sm">{fmtDate(finding.dueDate)}</dd>
          </div>
          {finding.ticketUrl && (
            <div className="sm:col-span-2">
              <dt className="text-ink-faint text-xs">External ticket</dt>
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
                {key.replaceAll("_", " ")}
              </dt>
              <dd className="mt-1 font-mono text-xs break-words">
                {typeof value === "string" || typeof value === "number"
                  ? String(value)
                  : JSON.stringify(value)}
              </dd>
            </div>
          ))}
        </dl>
        {finding.workflowNote && (
          <div className="border-line mt-5 border-t pt-4">
            <h3 className="text-ink-faint text-xs font-medium uppercase">
              Notes
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
            Ownership &amp; remediation
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

      {canEdit && finding.status !== "resolved" && (
        <section className="rise rise-3 border-line bg-card flex flex-wrap items-center justify-between gap-4 border p-5">
          <div>
            <h2 className="font-medium">Detection status</h2>
            <p className="text-ink-soft mt-1 text-sm">
              Acknowledging keeps the finding active; a sync resolves it only
              after the waste condition disappears.
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
