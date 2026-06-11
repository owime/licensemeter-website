import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { CopyScriptButton } from "~/components/workspace/CopyScriptButton";
import { RuleBadge } from "~/components/workspace/RuleBadge";
import { fmtDate, fmtMoney } from "~/lib/format";
import { ALL_RULES, isWasteRule, RULE_META } from "~/lib/rules";
import { hasRole, requireAccess } from "~/server/access";
import { setFindingStatus } from "~/server/actions";
import { db } from "~/server/db";
import { findings } from "~/server/db/schema";

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

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Findings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {showResolved
              ? `${rows.length} resolved findings`
              : `${rows.length} findings worth ${fmtMoney(shownImpact, ctx.tenant.currency)}/mo`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <CopyScriptButton
                url={`/api/export/remediation${ruleParam ? `?rule=${ruleParam}` : ""}`}
              />
              <a
                href={`/api/export/remediation${ruleParam ? `?rule=${ruleParam}` : ""}`}
                className="border border-line-strong bg-card px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition hover:border-ink"
              >
                Download .ps1
              </a>
            </>
          )}
          <a
            href="/api/export/findings"
            className="border border-line-strong bg-card px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition hover:border-ink"
          >
            Export CSV
          </a>
        </div>
      </header>

      <nav className="rise rise-2 mt-6 flex flex-wrap gap-2">
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

      <div className="rise rise-3 mt-5 mb-8 overflow-x-auto border border-line bg-card">
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
                  <td className="tnum px-4 py-3 text-right font-mono font-medium text-rust">
                    {f.monthlyImpactCents > 0
                      ? fmtMoney(f.monthlyImpactCents, ctx.tenant.currency)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                    {fmtDate(f.firstSeenAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium tracking-wide uppercase ${
                        f.status === "open"
                          ? "text-rust"
                          : f.status === "acknowledged"
                            ? "text-gold"
                            : "text-moss"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  {isAdmin && !showResolved && (
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await setFindingStatus(
                            f.id,
                            f.status === "open" ? "acknowledged" : "open",
                          );
                        }}
                      >
                        <button className="border border-line px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase hover:border-ink">
                          {f.status === "open" ? "Acknowledge" : "Reopen"}
                        </button>
                      </form>
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
                  Nothing here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
