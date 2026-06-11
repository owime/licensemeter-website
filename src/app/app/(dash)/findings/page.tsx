import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { CopyScriptButton } from "~/components/workspace/CopyScriptButton";
import { RuleBadge } from "~/components/workspace/RuleBadge";
import { ButtonAnchor, Pill, buttonClass } from "~/components/ui";
import { fmtDate, fmtMoney } from "~/lib/format";
import { ALL_RULES, isWasteRule, RULE_META } from "~/lib/rules";
import { hasRole, requireAccess } from "~/server/access";
import { setFindingStatus } from "~/server/actions";
import { db } from "~/server/db";
import { findings } from "~/server/db/schema";
import type { FindingStatus } from "~/server/types";

type FindingRow = typeof findings.$inferSelect;

const StatusPill = ({ status }: { status: FindingStatus }) => (
  <Pill
    tone={status === "open" ? "rust" : status === "acknowledged" ? "outline" : "moss"}
  >
    {status}
  </Pill>
);

const AckButton = ({ finding }: { finding: FindingRow }) => (
  <form
    action={async () => {
      "use server";
      await setFindingStatus(
        finding.id,
        finding.status === "open" ? "acknowledged" : "open",
      );
    }}
  >
    <button className={buttonClass("micro")}>
      {finding.status === "open" ? "Acknowledge" : "Reopen"}
    </button>
  </form>
);

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
  const currency = ctx.tenant.currency;

  const allRows = await db.query.findings.findMany({
    where: eq(findings.tenantId, ctx.tenant.id),
    orderBy: desc(findings.monthlyImpactCents),
  });

  const activeRows = allRows.filter((f) => f.status !== "resolved");
  const rows = (showResolved ? allRows.filter((f) => f.status === "resolved") : activeRows).filter(
    (f) => !ruleParam || f.rule === ruleParam,
  );

  const totalByRule = new Map<string, { count: number; impact: number }>();
  for (const f of activeRows) {
    const agg = totalByRule.get(f.rule) ?? { count: 0, impact: 0 };
    agg.count += 1;
    agg.impact += f.monthlyImpactCents;
    totalByRule.set(f.rule, agg);
  }
  const shownImpact = rows.reduce((s, f) => s + f.monthlyImpactCents, 0);

  const filterHref = (rule: string | null, resolved = false) => {
    const params = new URLSearchParams();
    if (rule) params.set("rule", rule);
    if (resolved) params.set("show", "resolved");
    const qs = params.toString();
    return `/app/findings${qs ? `?${qs}` : ""}`;
  };

  const emptyMessage = showResolved
    ? "No resolved findings yet."
    : ruleParam
      ? "No findings match this filter."
      : "No open findings — nothing to reclaim right now.";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Findings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {showResolved
              ? `${rows.length} resolved findings`
              : `${rows.length} findings worth ${fmtMoney(shownImpact, currency)}/mo`}
          </p>
        </div>
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
      </header>

      <nav aria-label="Finding filters" className="rise rise-2 mt-8 flex flex-wrap gap-2">
        <Link
          href={filterHref(null)}
          className={`px-3 py-1.5 text-xs font-medium ${
            !ruleParam && !showResolved
              ? "bg-ink text-paper"
              : "border border-line bg-card text-ink-soft hover:border-ink"
          }`}
        >
          All open ({activeRows.length})
        </Link>
        {ALL_RULES.map((rule) => {
          const agg = totalByRule.get(rule);
          return (
            <Link
              key={rule}
              href={filterHref(rule)}
              className={`px-3 py-1.5 text-xs font-medium ${
                ruleParam === rule && !showResolved
                  ? "bg-ink text-paper"
                  : "border border-line bg-card text-ink-soft hover:border-ink"
              }`}
            >
              {RULE_META[rule].short} ({agg?.count ?? 0})
            </Link>
          );
        })}
        <Link
          href={filterHref(null, true)}
          className={`px-3 py-1.5 text-xs font-medium ${
            showResolved
              ? "bg-ink text-paper"
              : "border border-line bg-card text-ink-soft hover:border-ink"
          }`}
        >
          Resolved
        </Link>
      </nav>

      {/* Desktop table */}
      <div className="rise rise-3 mt-5 mb-8 hidden overflow-x-auto border border-line bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-[0.14em] text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Rule</th>
              <th className="px-4 py-3 font-medium">Finding</th>
              <th className="px-4 py-3 text-right font-medium">Impact / mo</th>
              <th className="px-4 py-3 font-medium">First seen</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {isAdmin && !showResolved && (
                <th className="px-4 py-3 text-right font-medium">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const detail = f.detail as { upn?: string };
              return (
                <tr
                  key={f.id}
                  className="border-b border-line align-top last:border-b-0 hover:bg-paper"
                >
                  <td className="px-4 py-3">
                    <RuleBadge rule={f.rule} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{f.title}</div>
                    {detail.upn && (
                      <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {detail.upn}
                      </div>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono font-medium text-rust-text">
                    {f.monthlyImpactCents > 0
                      ? fmtMoney(f.monthlyImpactCents, currency)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                    {fmtDate(f.firstSeenAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={f.status} />
                  </td>
                  {isAdmin && !showResolved && (
                    <td className="px-4 py-3 text-right">
                      <AckButton finding={f} />
                    </td>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin && !showResolved ? 6 : 5}
                  className="px-4 py-10 text-center text-ink-soft"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="rise rise-3 mt-5 mb-8 flex flex-col gap-3 md:hidden">
        {rows.map((f) => {
          const detail = f.detail as { upn?: string };
          return (
            <li key={f.id} className="border border-line bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <RuleBadge rule={f.rule} />
                <StatusPill status={f.status} />
              </div>
              <div className="mt-2 text-sm font-medium">{f.title}</div>
              {detail.upn && (
                <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                  {detail.upn}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-ink-soft">
                  First seen {fmtDate(f.firstSeenAt)}
                </span>
                <span className="tnum font-mono text-sm font-medium text-rust-text">
                  {f.monthlyImpactCents > 0
                    ? `${fmtMoney(f.monthlyImpactCents, currency)}/mo`
                    : "—"}
                </span>
              </div>
              {isAdmin && !showResolved && (
                <div className="mt-3 border-t border-line pt-3">
                  <AckButton finding={f} />
                </div>
              )}
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="border border-line bg-card px-4 py-10 text-center text-sm text-ink-soft">
            {emptyMessage}
          </li>
        )}
      </ul>
    </div>
  );
}
