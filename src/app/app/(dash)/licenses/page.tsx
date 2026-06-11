import { eq } from "drizzle-orm";

import { PriceEditor } from "~/components/workspace/PriceRow";
import { fmtMoney, fmtNumber } from "~/lib/format";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { priceBook, tenantSkus } from "~/server/db/schema";

export default async function LicensesPage() {
  const ctx = await requireAccess("viewer");
  const isAdmin = hasRole(ctx, "admin");
  const currency = ctx.tenant.currency;

  const [skus, prices] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, ctx.tenant.id) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, ctx.tenant.id) }),
  ]);
  const priceRows = new Map(prices.map((p) => [p.skuId, p]));
  const sorted = [...skus].sort((a, b) =>
    (a.displayName ?? a.skuPartNumber).localeCompare(
      b.displayName ?? b.skuPartNumber,
    ),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            Licenses &amp; prices
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Prices start as list-price estimates. Enter what you actually pay
            per seat and month — every impact figure recalculates from your
            numbers. There is no Microsoft API for tenant pricing.
          </p>
        </div>
        <a
          href="/api/export/licenses"
          className="border border-line-strong bg-card px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition hover:border-ink"
        >
          Export CSV
        </a>
      </header>

      <div className="rise rise-2 mt-6 mb-8 overflow-x-auto border border-line bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-[0.14em] text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 text-right font-medium">Purchased</th>
              <th className="px-4 py-3 text-right font-medium">Assigned</th>
              <th className="px-4 py-3 text-right font-medium">Spend / mo</th>
              <th className="px-4 py-3 font-medium">Price source</th>
              <th className="px-4 py-3 text-right font-medium">
                Price / seat / mo
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const p = priceRows.get(s.skuId);
              const cents = p?.monthlyPriceCents ?? 0;
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
                  <td className="tnum px-4 py-3 text-right font-mono">
                    {fmtMoney(s.consumedUnits * cents, currency)}
                  </td>
                  <td className="px-4 py-3">
                    {cents === 0 ? (
                      <span className="bg-rust-soft px-2 py-0.5 text-[11px] font-medium tracking-wide text-rust-deep uppercase">
                        Set a price
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${
                          p?.source === "custom"
                            ? "bg-moss-soft text-moss"
                            : "bg-slate-soft text-slate-ink"
                        }`}
                      >
                        {p?.source === "custom" ? "Your price" : "List estimate"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <PriceEditor
                        skuId={s.skuId}
                        initial={(cents / 100).toFixed(2)}
                        currency={currency}
                      />
                    ) : (
                      <div className="tnum text-right font-mono">
                        {fmtMoney(cents, currency)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  No license data yet — run a sync.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
