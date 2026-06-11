import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";

import { RuleBadge } from "~/components/workspace/RuleBadge";
import { SyncNowButton } from "~/components/workspace/SyncNowButton";
import { fmtAgo, fmtMoney, fmtNumber } from "~/lib/format";
import { requireAccess, hasRole } from "~/server/access";
import { db } from "~/server/db";
import { findings, priceBook, syncRuns, tenantSkus } from "~/server/db/schema";

export default async function OverviewPage() {
  const ctx = await requireAccess("viewer");
  const tenantId = ctx.tenant.id;
  const currency = ctx.tenant.currency;

  const [skus, prices, openFindings, lastRun] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, tenantId) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, tenantId) }),
    db.query.findings.findMany({
      where: and(
        eq(findings.tenantId, tenantId),
        inArray(findings.status, ["open", "acknowledged"]),
      ),
      orderBy: desc(findings.monthlyImpactCents),
    }),
    db.query.syncRuns.findFirst({
      where: eq(syncRuns.tenantId, tenantId),
      orderBy: desc(syncRuns.startedAt),
    }),
  ]);

  const priceBySku = new Map(prices.map((p) => [p.skuId, p.monthlyPriceCents]));
  const monthlySpend = skus.reduce(
    (sum, s) => sum + s.consumedUnits * (priceBySku.get(s.skuId) ?? 0),
    0,
  );
  const monthlyWaste = openFindings.reduce(
    (sum, f) => sum + f.monthlyImpactCents,
    0,
  );
  const wasteShare = monthlySpend > 0 ? (monthlyWaste / monthlySpend) * 100 : 0;
  const sortedSkus = [...skus].sort(
    (a, b) =>
      b.consumedUnits * (priceBySku.get(b.skuId) ?? 0) -
      a.consumedUnits * (priceBySku.get(a.skuId) ?? 0),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {lastRun?.status === "running"
              ? "Sync running…"
              : `Last synced ${fmtAgo(lastRun?.finishedAt ?? null)}`}
            {lastRun?.status === "failed" && (
              <span className="ml-2 text-rust">— last sync failed</span>
            )}
          </p>
        </div>
        {hasRole(ctx, "admin") && <SyncNowButton />}
      </header>

      <section className="rise rise-2 mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Monthly license spend",
            value: fmtMoney(monthlySpend, currency),
            sub: `${fmtNumber(skus.reduce((s, x) => s + x.consumedUnits, 0))} assigned seats`,
            tone: "ink",
          },
          {
            label: "Monthly waste",
            value: fmtMoney(monthlyWaste, currency),
            sub: `${wasteShare.toFixed(1)}% of spend`,
            tone: "rust",
          },
          {
            label: "Annualized waste",
            value: fmtMoney(monthlyWaste * 12, currency),
            sub: "if nothing changes",
            tone: "rust",
          },
          {
            label: "Open findings",
            value: fmtNumber(openFindings.length),
            sub: "across 6 rules",
            tone: "ink",
          },
        ].map((card) => (
          <div key={card.label} className="bg-card px-5 py-5">
            <div className="text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">
              {card.label}
            </div>
            <div
              className={`mt-2 font-display text-3xl tracking-tight ${
                card.tone === "rust" ? "text-rust" : "text-ink"
              }`}
            >
              {card.value}
            </div>
            <div className="mt-1 text-xs text-ink-soft">{card.sub}</div>
          </div>
        ))}
      </section>

      <section className="rise rise-3 mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
            License inventory
          </h2>
          <a
            href="/api/export/licenses"
            className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Export CSV
          </a>
        </div>
        <div className="mt-3 overflow-x-auto border border-line bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Purchased</th>
                <th className="px-4 py-3 text-right font-medium">Assigned</th>
                <th className="px-4 py-3 text-right font-medium">Unassigned</th>
                <th className="px-4 py-3 font-medium">Utilization</th>
                <th className="px-4 py-3 text-right font-medium">Spend / mo</th>
              </tr>
            </thead>
            <tbody>
              {sortedSkus.map((s) => {
                const price = priceBySku.get(s.skuId) ?? 0;
                const free = s.prepaidEnabled - s.consumedUnits;
                const util =
                  s.prepaidEnabled > 0
                    ? Math.min((s.consumedUnits / s.prepaidEnabled) * 100, 100)
                    : 0;
                return (
                  <tr
                    key={s.skuId}
                    className="border-b border-line last:border-b-0 hover:bg-paper"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {s.displayName ?? s.skuPartNumber}
                      </div>
                      <div className="font-mono text-[11px] text-ink-faint">
                        {s.skuPartNumber}
                      </div>
                    </td>
                    <td className="tnum px-4 py-3 text-right font-mono">
                      {fmtNumber(s.prepaidEnabled)}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-mono">
                      {fmtNumber(s.consumedUnits)}
                    </td>
                    <td
                      className={`tnum px-4 py-3 text-right font-mono ${
                        free > 0 ? "font-medium text-rust" : "text-ink-faint"
                      }`}
                    >
                      {fmtNumber(free)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-24 bg-line">
                          <div
                            className={`h-1 ${util < 80 ? "bg-rust" : "bg-moss"}`}
                            style={{ width: `${util}%` }}
                          />
                        </div>
                        <span className="tnum font-mono text-xs text-ink-soft">
                          {util.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="tnum px-4 py-3 text-right font-mono">
                      {fmtMoney(s.consumedUnits * price, currency)}
                    </td>
                  </tr>
                );
              })}
              {sortedSkus.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                    No license data yet — run a sync.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rise rise-4 mt-10 mb-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
            Largest open findings
          </h2>
          <Link
            href="/app/findings"
            className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            All findings →
          </Link>
        </div>
        <ul className="mt-3 border border-line bg-card">
          {openFindings.slice(0, 6).map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RuleBadge rule={f.rule} />
                <span className="truncate text-sm">{f.title}</span>
              </div>
              <span className="tnum shrink-0 font-mono text-sm font-medium text-rust">
                {f.monthlyImpactCents > 0
                  ? `${fmtMoney(f.monthlyImpactCents, currency)}/mo`
                  : "—"}
              </span>
            </li>
          ))}
          {openFindings.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-ink-soft">
              No open findings. Either the tenant is spotless or the first sync
              has not finished yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
