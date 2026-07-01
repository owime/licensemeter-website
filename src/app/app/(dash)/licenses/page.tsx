import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PackageOpen } from "lucide-react";

import { ImportPricesForm } from "./ImportPricesForm";
import { EmptyState } from "~/components/workspace/EmptyState";
import { PriceEditor } from "~/components/workspace/PriceRow";
import { ButtonAnchor, ButtonLink, Card, Pill } from "~/components/ui";
import { CONNECTORS } from "~/lib/connectors";
import { fmtMoney, fmtNumber } from "~/lib/format";
import { adobePriceKey } from "~/server/adobe/analyze";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { isShelfwareExempt } from "~/server/waste/engine";
import { saasPriceKey } from "~/server/saas/analyze";
import {
  adobeUsers,
  priceBook,
  saasSeats,
  tenantSkus,
} from "~/server/db/schema";

export const metadata: Metadata = { title: "Licenses & prices" };

type PriceRow = typeof priceBook.$inferSelect;

const PriceSourcePill = ({ price }: { price: PriceRow | undefined }) => {
  if (!price || price.monthlyPriceCents === 0) {
    return <Pill tone="gold">Set a price</Pill>;
  }
  return price.source === "custom" ? (
    <Pill tone="moss">Your price</Pill>
  ) : (
    <Pill tone="slate">List estimate</Pill>
  );
};

export default async function LicensesPage() {
  const ctx = await requireAccess("viewer");
  const isAdmin = hasRole(ctx, "admin");
  const locked = !ctx.entitlement.active;
  const currency = ctx.tenant.currency;
  // Trial workspaces (consentedAt null, never the demo) have no sync button,
  // so do not tell them to run one.
  const isTrial = !ctx.tenant.consentedAt && !ctx.tenant.isDemo;
  const emptyMessage = isTrial
    ? "No license data yet. Upload a fresh export to update this workspace."
    : "No license data yet. Run a sync.";

  const [skus, prices, adobeSeats, saasSeatRows] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, ctx.tenant.id) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, ctx.tenant.id) }),
    // Only the product arrays are needed to tally seat counts; don't pull the
    // full per-user rows.
    db.query.adobeUsers.findMany({
      where: eq(adobeUsers.tenantId, ctx.tenant.id),
      columns: { products: true },
    }),
    db.query.saasSeats.findMany({
      where: eq(saasSeats.tenantId, ctx.tenant.id),
      columns: { provider: true, products: true },
    }),
  ]);
  const priceRows = new Map(prices.map((p) => [p.skuId, p]));

  const adobeProducts = [
    ...adobeSeats
      .flatMap((u) => u.products)
      .reduce(
        (m, product) => m.set(product, (m.get(product) ?? 0) + 1),
        new Map<string, number>(),
      ),
  ].sort((a, b) => a[0].localeCompare(b[0]));
  // Unpriced connectors (AI consoles) bill API usage, not seats. No price rows.
  const saasSections = CONNECTORS.filter((c) => !c.unpriced)
    .map(({ provider, label }) => ({
      provider,
      label,
      products: [
        ...saasSeatRows
          .filter((s) => s.provider === provider)
          .flatMap((s) => s.products)
          .reduce(
            (m, product) => m.set(product, (m.get(product) ?? 0) + 1),
            new Map<string, number>(),
          ),
      ].sort((a, b) => a[0].localeCompare(b[0])),
    }))
    .filter((section) => section.products.length > 0);
  // Drop Microsoft free/viral/capacity sentinel SKUs (WINDOWS_STORE's 1,000,000
  // prepaid units, FLOW_FREE, etc.) so this table matches Overview's inventory
  // and the licenses CSV export, which both apply the same exemption.
  const realSkus = skus.filter(
    (s) => !isShelfwareExempt(s.skuPartNumber, s.prepaidEnabled),
  );
  const sorted = [...realSkus].sort((a, b) =>
    (a.displayName ?? a.skuPartNumber).localeCompare(
      b.displayName ?? b.skuPartNumber,
    ),
  );

  // Over-assigned SKUs (assigned > purchased) have no spare seats; clamp to 0.
  const unassignedOf = (s: (typeof sorted)[number]) =>
    Math.max(0, s.prepaidEnabled - s.consumedUnits);
  const totals = sorted.reduce(
    (acc, s) => {
      const cents = priceRows.get(s.skuId)?.monthlyPriceCents ?? 0;
      return {
        purchased: acc.purchased + s.prepaidEnabled,
        assigned: acc.assigned + s.consumedUnits,
        unassigned: acc.unassigned + unassignedOf(s),
        spendCents: acc.spendCents + s.consumedUnits * cents,
      };
    },
    { purchased: 0, assigned: 0, unassigned: 0, spendCents: 0 },
  );

  // Figures still rest on Microsoft list prices until a custom price is saved
  // (mirrors the Overview "Price accuracy" detection).
  const listPricesOnly =
    prices.length > 0 && !prices.some((p) => p.source === "custom");

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            Licenses &amp; prices
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Prices start as list-price estimates. Enter what you actually pay
            per seat and month. Every impact figure recalculates from your
            numbers. There is no Microsoft API for tenant pricing.
          </p>
        </div>
        {locked ? (
          <ButtonLink href="/app/billing">Upgrade to export</ButtonLink>
        ) : (
          <ButtonAnchor href="/api/export/licenses">Export CSV</ButtonAnchor>
        )}
      </header>

      {listPricesOnly && (
        <section className="rise rise-2 mt-6">
          <Card title="Price accuracy">
            <p className="max-w-2xl text-sm text-ink-soft">
              Every figure below still uses Microsoft list-price estimates. Enter
              what you actually pay per seat to make spend and waste exact — your
              numbers override the estimates immediately.
            </p>
          </Card>
        </section>
      )}

      {/* Desktop table */}
      <div className="rise rise-2 mt-8 mb-8 hidden overflow-x-auto border border-line bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-[0.14em] text-ink-faint uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Purchased</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Assigned</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Unassigned</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Spend / mo</th>
              <th scope="col" className="px-4 py-3 font-medium">Price source</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Price / seat / mo
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const p = priceRows.get(s.skuId);
              const cents = p?.monthlyPriceCents ?? 0;
              const free = unassignedOf(s);
              return (
                <tr
                  key={s.skuId}
                  className="border-b border-line last:border-b-0 hover:bg-canvas"
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
                    {fmtNumber(s.prepaidEnabled, currency)}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono">
                    {fmtNumber(s.consumedUnits, currency)}
                  </td>
                  <td
                    className={`tnum px-4 py-3 text-right font-mono ${
                      free > 0 ? "font-medium text-waste-text" : "text-ink-faint"
                    }`}
                  >
                    {fmtNumber(free, currency)}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono">
                    {fmtMoney(s.consumedUnits * cents, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <PriceSourcePill price={p} />
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <PriceEditor
                        skuId={s.skuId}
                        name={s.displayName ?? s.skuPartNumber}
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
                <td colSpan={7}>
                  <EmptyState icon={PackageOpen} heading="No license data yet.">
                    {emptyMessage}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-line text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  Total
                </th>
                <td className="tnum px-4 py-3 text-right font-mono text-ink">
                  {fmtNumber(totals.purchased, currency)}
                </td>
                <td className="tnum px-4 py-3 text-right font-mono text-ink">
                  {fmtNumber(totals.assigned, currency)}
                </td>
                <td
                  className={`tnum px-4 py-3 text-right font-mono ${
                    totals.unassigned > 0 ? "font-medium text-waste-text" : "text-ink"
                  }`}
                >
                  {fmtNumber(totals.unassigned, currency)}
                </td>
                <td className="tnum px-4 py-3 text-right font-mono font-semibold text-ink">
                  {fmtMoney(totals.spendCents, currency)}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="rise rise-2 mt-8 mb-8 flex flex-col gap-3 md:hidden">
        {sorted.map((s) => {
          const p = priceRows.get(s.skuId);
          const cents = p?.monthlyPriceCents ?? 0;
          return (
            <li key={s.skuId} className="border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {s.displayName ?? s.skuPartNumber}
                  </div>
                  <div className="font-mono text-[11px] text-ink-faint">
                    {s.skuPartNumber}
                  </div>
                </div>
                <PriceSourcePill price={p} />
              </div>
              <dl className="tnum mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="font-sans text-xs text-ink-faint">Purchased</dt>
                  <dd>{fmtNumber(s.prepaidEnabled, currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-sans text-xs text-ink-faint">Assigned</dt>
                  <dd>{fmtNumber(s.consumedUnits, currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-sans text-xs text-ink-faint">Unassigned</dt>
                  <dd
                    className={
                      unassignedOf(s) > 0 ? "font-medium text-waste-text" : ""
                    }
                  >
                    {fmtNumber(unassignedOf(s), currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-sans text-xs text-ink-faint">Spend/mo</dt>
                  <dd>{fmtMoney(s.consumedUnits * cents, currency)}</dd>
                </div>
              </dl>
              <div className="mt-3 border-t border-line pt-3">
                {isAdmin ? (
                  <PriceEditor
                    skuId={s.skuId}
                    name={s.displayName ?? s.skuPartNumber}
                    initial={(cents / 100).toFixed(2)}
                    currency={currency}
                  />
                ) : (
                  <div className="tnum text-right font-mono text-sm">
                    {fmtMoney(cents, currency)} / seat / mo
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="border border-line bg-card">
            <EmptyState icon={PackageOpen} heading="No license data yet.">
              {emptyMessage}
            </EmptyState>
          </li>
        )}
        {sorted.length > 0 && (
          <li className="border border-line bg-card p-4">
            <dl className="tnum grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm">
              <div className="flex justify-between gap-2">
                <dt className="font-sans text-xs font-medium text-ink-faint uppercase">
                  Total purchased
                </dt>
                <dd>{fmtNumber(totals.purchased, currency)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="font-sans text-xs font-medium text-ink-faint uppercase">
                  Total assigned
                </dt>
                <dd>{fmtNumber(totals.assigned, currency)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="font-sans text-xs font-medium text-ink-faint uppercase">
                  Total unassigned
                </dt>
                <dd className={totals.unassigned > 0 ? "font-medium text-waste-text" : ""}>
                  {fmtNumber(totals.unassigned, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="font-sans text-xs font-medium text-ink-faint uppercase">
                  Total spend/mo
                </dt>
                <dd className="font-semibold">{fmtMoney(totals.spendCents, currency)}</dd>
              </div>
            </dl>
          </li>
        )}
      </ul>

      {adobeProducts.length > 0 && (
        <section className="rise rise-3 mb-8">
          <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
            Adobe products
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Seat counts come from the Adobe Admin Console; Adobe publishes no
            price API, so enter your per-seat price to put a number on the
            offboarding leaks.
          </p>
          <ul className="mt-3 border border-line bg-card">
            {adobeProducts.map(([product, count]) => {
              const p = priceRows.get(adobePriceKey(product));
              const cents = p?.monthlyPriceCents ?? 0;
              return (
                <li
                  key={product}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{product}</span>
                    <span className="tnum ml-3 font-mono text-sm text-ink-soft">
                      {fmtNumber(count, currency)} seats
                    </span>
                  </div>
                  {isAdmin ? (
                    <PriceEditor
                      skuId={adobePriceKey(product)}
                      name={product}
                      initial={(cents / 100).toFixed(2)}
                      currency={currency}
                    />
                  ) : (
                    <span className="tnum font-mono text-sm">
                      {fmtMoney(cents, currency)} / seat / mo
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {saasSections.map(({ provider, label, products }) => (
        <section key={provider} className="rise rise-3 mb-8">
          <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
            {label} products
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Seat counts come from the {label} connector; {label} publishes no
            price API, so enter your per-seat price to put a number on the
            findings.
          </p>
          <ul className="mt-3 border border-line bg-card">
            {products.map(([product, count]) => {
              const p = priceRows.get(saasPriceKey(provider, product));
              const cents = p?.monthlyPriceCents ?? 0;
              return (
                <li
                  key={product}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{product}</span>
                    <span className="tnum ml-3 font-mono text-sm text-ink-soft">
                      {fmtNumber(count, currency)} seats
                    </span>
                  </div>
                  {isAdmin ? (
                    <PriceEditor
                      skuId={saasPriceKey(provider, product)}
                      name={product}
                      initial={(cents / 100).toFixed(2)}
                      currency={currency}
                    />
                  ) : (
                    <span className="tnum font-mono text-sm">
                      {fmtMoney(cents, currency)} / seat / mo
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {isAdmin && (
        <section className="rise rise-3 mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xs font-medium tracking-[0.18em] text-ink-faint uppercase">
              Bulk price import
            </h2>
            {!locked && (
              <a
                href="/api/export/pricebook"
                className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                Export price book CSV
              </a>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Maintaining prices for many products or workspaces? Export the
            price book, fill in what you pay in a spreadsheet, and paste the
            result back here.
          </p>
          <div className="mt-3 border border-line bg-card p-4">
            <ImportPricesForm />
          </div>
        </section>
      )}
    </div>
  );
}
