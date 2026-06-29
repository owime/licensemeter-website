import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { CircleCheck, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CopyScriptButton } from "~/components/workspace/CopyScriptButton";
import { EmptyState } from "~/components/workspace/EmptyState";
import { FindingChip } from "~/components/workspace/FindingChip";
import {
  CheckboxHitArea,
  FindingsBulkForm,
  SelectAllFindings,
} from "~/components/workspace/FindingsSelectionBar";
import { PaywallCard } from "~/components/workspace/PaywallCard";
import { ButtonAnchor, Pill, buttonClass } from "~/components/ui";
import { fmtDate, fmtMoney } from "~/lib/format";
import { ALL_RULES, isWasteRule, RULE_META } from "~/lib/rules";
import { hasRole, requireAccess } from "~/server/access";
import { bulkSetFindingStatus, setFindingStatus } from "~/server/actions";
import { db } from "~/server/db";
import { findings } from "~/server/db/schema";
import type { FindingStatus } from "~/server/types";

export const metadata: Metadata = { title: "Findings" };

const PAGE_SIZE = 50;

type FindingRow = typeof findings.$inferSelect;

const StatusPill = ({ status }: { status: FindingStatus }) => (
  <Pill
    tone={status === "open" ? "brand" : status === "acknowledged" ? "outline" : "moss"}
  >
    {status}
  </Pill>
);

/**
 * Desktop rows live inside the bulk form, so the per-row action uses
 * formAction (nested forms are invalid HTML); mobile cards get their own form.
 */
const AckButton = ({
  finding,
  standalone = false,
}: {
  finding: FindingRow;
  standalone?: boolean;
}) => {
  const toggle = async () => {
    "use server";
    await setFindingStatus(
      finding.id,
      finding.status === "open" ? "acknowledged" : "open",
    );
  };
  const button = (
    <button
      {...(standalone ? {} : { formAction: toggle })}
      className={buttonClass("micro")}
    >
      {finding.status === "open" ? "Acknowledge" : "Reopen"}
    </button>
  );
  return standalone ? <form action={toggle}>{button}</form> : button;
};

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireAccess("viewer");
  const sp = await searchParams;
  const ruleParam = typeof sp.rule === "string" && isWasteRule(sp.rule) ? sp.rule : null;
  const showResolved = sp.show === "resolved";
  const isAdmin = hasRole(ctx, "admin");
  const locked = !ctx.entitlement.active;
  // Acknowledge/bulk/export require an active entitlement; the list itself stays
  // readable when locked so Overview links here don't dead-end on a paywall.
  const canAct = isAdmin && !locked;
  const currency = ctx.tenant.currency;

  // Status + rule filtering, counts and pagination all run in Postgres so a
  // large tenant never streams every finding into the page. Active findings are
  // open or acknowledged; resolved is a separate view.
  const statusFilter = showResolved
    ? eq(findings.status, "resolved")
    : inArray(findings.status, ["open", "acknowledged"]);
  const listWhere = and(
    eq(findings.tenantId, ctx.tenant.id),
    statusFilter,
    ruleParam ? eq(findings.rule, ruleParam) : undefined,
  );

  // Per-rule active counts drive the filter chips (which always link to the
  // active view), and the headline total/impact for the current filtered set.
  const [activeAgg, totals] = await Promise.all([
    db
      .select({ rule: findings.rule, count: sql<number>`count(*)::int` })
      .from(findings)
      .where(
        and(
          eq(findings.tenantId, ctx.tenant.id),
          inArray(findings.status, ["open", "acknowledged"]),
        ),
      )
      .groupBy(findings.rule),
    db
      .select({
        total: sql<number>`count(*)::int`,
        impact: sql<number>`coalesce(sum(${findings.monthlyImpactCents}), 0)::int`,
      })
      .from(findings)
      .where(listWhere)
      .then((r) => r[0] ?? { total: 0, impact: 0 }),
  ]);

  const totalByRule = new Map<string, { count: number }>();
  for (const r of activeAgg) totalByRule.set(r.rule, { count: r.count });
  const activeTotal = activeAgg.reduce((s, r) => s + r.count, 0);
  const rowCount = totals.total;
  const shownImpact = totals.impact;

  const totalPages = Math.max(1, Math.ceil(rowCount / PAGE_SIZE));
  const pageRaw = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Math.min(
    Math.max(Number.isFinite(pageRaw) ? pageRaw : 1, 1),
    totalPages,
  );
  const pageRows = await db.query.findings.findMany({
    where: listWhere,
    orderBy: desc(findings.monthlyImpactCents),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const filterHref = (rule: string | null, resolved = false, pageNo = 1) => {
    const params = new URLSearchParams();
    if (rule) params.set("rule", rule);
    if (resolved) params.set("show", "resolved");
    if (pageNo > 1) params.set("page", String(pageNo));
    const qs = params.toString();
    return `/app/findings${qs ? `?${qs}` : ""}`;
  };
  const pageHref = (pageNo: number) =>
    filterHref(ruleParam, showResolved, pageNo);

  /** Hide zero-count rule chips, but keep an active zero-count filter escapable. */
  const visibleRules = ALL_RULES.filter(
    (rule) => (totalByRule.get(rule)?.count ?? 0) > 0 || rule === ruleParam,
  );

  const empty = showResolved
    ? { icon: CircleCheck, heading: "No resolved findings yet." }
    : ruleParam
      ? { icon: SearchX, heading: "No findings match this filter." }
      : {
          icon: CircleCheck,
          heading: "No open findings.",
          subtext: "Nothing to reclaim right now.",
        };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Findings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {showResolved
              ? `${rowCount} resolved findings`
              : `${rowCount} findings worth ${fmtMoney(shownImpact, currency)}/mo`}
          </p>
        </div>
        {!locked && (
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <CopyScriptButton
                  url={`/api/export/remediation${ruleParam ? `?rule=${ruleParam}` : ""}`}
                />
                <ButtonAnchor
                  href={`/api/export/remediation${ruleParam ? `?rule=${ruleParam}` : ""}`}
                >
                  Download .ps1
                </ButtonAnchor>
              </>
            )}
            <ButtonAnchor href="/api/export/findings">Export CSV</ButtonAnchor>
          </div>
        )}
      </header>

      {locked && (
        <div className="rise rise-2 mt-8">
          <PaywallCard isOwner={hasRole(ctx, "owner")} state={ctx.entitlement.state} />
        </div>
      )}

      <nav aria-label="Finding filters" className="rise rise-2 mt-8 flex flex-wrap gap-2">
        <Link
          href={filterHref(null)}
          aria-current={!ruleParam && !showResolved ? "true" : undefined}
          className={`relative px-3 py-1.5 text-xs font-medium after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] ${
            !ruleParam && !showResolved
              ? "bg-ink text-canvas"
              : "border border-line bg-card text-ink-soft hover:border-ink"
          }`}
        >
          All active ({activeTotal})
        </Link>
        {visibleRules.map((rule) => {
          const agg = totalByRule.get(rule);
          return (
            <Link
              key={rule}
              href={filterHref(rule)}
              aria-current={
                ruleParam === rule && !showResolved ? "true" : undefined
              }
              className={`relative px-3 py-1.5 text-xs font-medium after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] ${
                ruleParam === rule && !showResolved
                  ? "bg-ink text-canvas"
                  : "border border-line bg-card text-ink-soft hover:border-ink"
              }`}
            >
              {RULE_META[rule].short} ({agg?.count ?? 0})
            </Link>
          );
        })}
        <Link
          href={filterHref(null, true)}
          aria-current={showResolved ? "true" : undefined}
          className={`relative px-3 py-1.5 text-xs font-medium after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] ${
            showResolved
              ? "bg-ink text-canvas"
              : "border border-line bg-card text-ink-soft hover:border-ink"
          }`}
        >
          Resolved
        </Link>
      </nav>

      {/* Desktop table (one form: row checkboxes + bulk action) */}
      <FindingsBulkForm
        action={bulkSetFindingStatus}
        showBar={canAct && !showResolved && rowCount > 0}
      >
        <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {showResolved
              ? `${rowCount} resolved findings`
              : `${rowCount} active findings worth ${fmtMoney(shownImpact, currency)} per month${ruleParam ? `, filtered to ${RULE_META[ruleParam].label}` : ""}`}
          </caption>
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-[0.14em] text-ink-faint uppercase">
              {canAct && !showResolved && (
                <th scope="col" className="w-8 px-3 py-3">
                  <SelectAllFindings />
                </th>
              )}
              <th scope="col" className="px-4 py-3 font-medium">Rule</th>
              <th scope="col" className="px-4 py-3 font-medium">Finding</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Impact / mo
              </th>
              <th scope="col" className="px-4 py-3 font-medium">First seen</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              {canAct && !showResolved && (
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((f) => {
              const detail = f.detail as { upn?: string };
              return (
                <tr
                  key={f.id}
                  className="border-b border-line align-top last:border-b-0 hover:bg-canvas"
                >
                  {canAct && !showResolved && (
                    <td className="px-3 py-3">
                      <CheckboxHitArea>
                        <input
                          type="checkbox"
                          name="id"
                          value={f.id}
                          aria-label={`Select ${f.title}`}
                        />
                      </CheckboxHitArea>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <FindingChip rule={f.rule} detail={f.detail} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {f.graphUserId ? (
                        <Link
                          href={`/app/users/${f.graphUserId}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {f.title}
                        </Link>
                      ) : (
                        f.title
                      )}
                    </div>
                    {detail.upn && (
                      <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {detail.upn}
                      </div>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono font-medium text-waste-text">
                    {f.monthlyImpactCents > 0
                      ? fmtMoney(f.monthlyImpactCents, currency)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                    {fmtDate(f.firstSeenAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={f.status} />
                  </td>
                  {canAct && !showResolved && (
                    <td className="px-4 py-3 text-right">
                      <AckButton finding={f} />
                    </td>
                  )}
                </tr>
              );
            })}
            {rowCount === 0 && (
              <tr>
                <td colSpan={canAct && !showResolved ? 7 : 5}>
                  <EmptyState icon={empty.icon} heading={empty.heading}>
                    {empty.subtext}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </FindingsBulkForm>

      {/* Mobile stacked cards */}
      <ul className="rise rise-3 mt-5 mb-8 flex flex-col gap-3 md:hidden">
        {pageRows.map((f) => {
          const detail = f.detail as { upn?: string };
          return (
            <li key={f.id} className="border border-line bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <FindingChip rule={f.rule} detail={f.detail} />
                <StatusPill status={f.status} />
              </div>
              <div className="mt-2 text-sm font-medium">
                {f.graphUserId ? (
                  <Link
                    href={`/app/users/${f.graphUserId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {f.title}
                  </Link>
                ) : (
                  f.title
                )}
              </div>
              {detail.upn && (
                <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                  {detail.upn}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-ink-soft">
                  First seen {fmtDate(f.firstSeenAt)}
                </span>
                <span className="tnum font-mono text-sm font-medium text-waste-text">
                  {f.monthlyImpactCents > 0
                    ? `${fmtMoney(f.monthlyImpactCents, currency)}/mo`
                    : "-"}
                </span>
              </div>
              {canAct && !showResolved && (
                <div className="mt-3 border-t border-line pt-3">
                  <AckButton finding={f} standalone />
                </div>
              )}
            </li>
          );
        })}
        {rowCount === 0 && (
          <li className="border border-line bg-card">
            <EmptyState icon={empty.icon} heading={empty.heading}>
              {empty.subtext}
            </EmptyState>
          </li>
        )}
      </ul>

      {rowCount > PAGE_SIZE && (
        <nav
          aria-label="Findings pages"
          className="-mt-4 mb-8 flex flex-wrap items-center justify-between gap-3"
        >
          <span className="tnum text-xs text-ink-soft">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, rowCount)} of {rowCount}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonClass("micro")}>
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className={buttonClass("micro")}>
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
