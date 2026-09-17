import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PackageOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ImportPricesForm } from "./ImportPricesForm";
import { EmptyState } from "~/components/workspace/EmptyState";
import { PriceEditor } from "~/components/workspace/PriceRow";
import { PriceAccuracyCard } from "~/components/workspace/PriceAccuracyCard";
import { ButtonAnchor, Pill, buttonClass } from "~/components/ui";
import { CONNECTORS } from "~/lib/connectors";
import { fmtMoney, fmtNumber } from "~/lib/format";
import { calculatePriceCoverage } from "~/lib/priceCoverage";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("licenses");
  return { title: t("pageTitle") };
}

type PriceRow = typeof priceBook.$inferSelect;

const PriceSourcePill = ({
  price,
  t,
}: {
  price: PriceRow | undefined;
  t: Awaited<ReturnType<typeof getTranslations<"licenses">>>;
}) => {
  if (!price || price.monthlyPriceCents === 0) {
    return <Pill tone="gold">{t("priceSource.setAPrice")}</Pill>;
  }
  return price.source === "custom" ? (
    <Pill tone="moss">{t("priceSource.yourPrice")}</Pill>
  ) : (
    <Pill tone="slate">{t("priceSource.listEstimate")}</Pill>
  );
};

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("licenses");
  const ctx = await requireAccess("viewer");
  const sp = await searchParams;
  const query =
    typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 100) : "";
  const requestedFilter = typeof sp.pricing === "string" ? sp.pricing : "all";
  const pricingFilter = ["all", "unpriced", "estimate", "custom"].includes(
    requestedFilter,
  )
    ? requestedFilter
    : "all";
  const isAdmin = hasRole(ctx, "admin");
  const currency = ctx.tenant.currency;
  // Imported workspaces (consentedAt null, never the demo) have no sync button,
  // so do not tell them to run one.
  const isImported = !ctx.tenant.consentedAt && !ctx.tenant.isDemo;
  const emptyMessage = isImported
    ? t("emptyImported")
    : t("emptySync");

  const [skus, prices, adobeSeats, saasSeatRows] = await Promise.all([
    db.query.tenantSkus.findMany({
      where: eq(tenantSkus.tenantId, ctx.tenant.id),
    }),
    db.query.priceBook.findMany({
      where: eq(priceBook.tenantId, ctx.tenant.id),
    }),
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

  const allAdobeProducts = [
    ...adobeSeats
      .flatMap((u) => u.products)
      .reduce(
        (m, product) => m.set(product, (m.get(product) ?? 0) + 1),
        new Map<string, number>(),
      ),
  ].sort((a, b) => a[0].localeCompare(b[0]));
  // Unpriced connectors (AI consoles) bill API usage, not seats. No price rows.
  const allSaasSections = CONNECTORS.filter((c) => !c.unpriced)
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
  const allSorted = [...realSkus].sort((a, b) =>
    (a.displayName ?? a.skuPartNumber).localeCompare(
      b.displayName ?? b.skuPartNumber,
    ),
  );

  // Over-assigned SKUs (assigned > purchased) have no spare seats; clamp to 0.
  const unassignedOf = (s: (typeof allSorted)[number]) =>
    Math.max(0, s.prepaidEnabled - s.consumedUnits);
  const totals = allSorted.reduce(
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

  const coverageProducts = [
    ...allSorted.map((s) => ({
      seats: s.consumedUnits,
      priceCents: priceRows.get(s.skuId)?.monthlyPriceCents ?? 0,
      source: priceRows.get(s.skuId)?.source,
    })),
    ...allAdobeProducts.map(([product, count]) => ({
      seats: count,
      priceCents: priceRows.get(adobePriceKey(product))?.monthlyPriceCents ?? 0,
      source: priceRows.get(adobePriceKey(product))?.source,
    })),
    ...allSaasSections.flatMap(({ provider, products }) =>
      products.map(([product, count]) => ({
        seats: count,
        priceCents:
          priceRows.get(saasPriceKey(provider, product))?.monthlyPriceCents ??
          0,
        source: priceRows.get(saasPriceKey(provider, product))?.source,
      })),
    ),
  ];
  const priceCoverage = calculatePriceCoverage(coverageProducts);
  const matchesPrice = (price: PriceRow | undefined) =>
    pricingFilter === "all" ||
    (pricingFilter === "unpriced" &&
      (!price || price.monthlyPriceCents === 0)) ||
    (pricingFilter === "estimate" &&
      Boolean(
        price && price.monthlyPriceCents > 0 && price.source === "default",
      )) ||
    (pricingFilter === "custom" &&
      Boolean(
        price && price.monthlyPriceCents > 0 && price.source === "custom",
      ));
  const matchesQuery = (...values: string[]) =>
    !query || values.some((value) => value.toLowerCase().includes(query));
  const sorted = allSorted.filter(
    (s) =>
      matchesPrice(priceRows.get(s.skuId)) &&
      matchesQuery(s.displayName ?? "", s.skuPartNumber, s.skuId),
  );
  const adobeProducts = allAdobeProducts.filter(
    ([product]) =>
      matchesPrice(priceRows.get(adobePriceKey(product))) &&
      matchesQuery(product, adobePriceKey(product)),
  );
  const saasSections = allSaasSections
    .map((section) => ({
      ...section,
      products: section.products.filter(
        ([product]) =>
          matchesPrice(
            priceRows.get(saasPriceKey(section.provider, product)),
          ) &&
          matchesQuery(
            section.label,
            product,
            saasPriceKey(section.provider, product),
          ),
      ),
    }))
    .filter((section) => section.products.length > 0);
  const filtersActive = Boolean(query) || pricingFilter !== "all";
  const tableEmptyHeading = filtersActive
    ? t("page.emptyHeadingFiltered")
    : t("page.emptyHeadingDefault");
  const tableEmptyMessage = filtersActive
    ? t("page.emptyMessageFiltered")
    : emptyMessage;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {t("page.heading")}
          </h1>
          <p className="text-ink-soft mt-1 max-w-2xl text-sm">
            {t("page.subheading")}
          </p>
          {isAdmin && (
            <p className="text-ink-faint mt-2 text-xs">
              {t("page.adminHint")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <a href="#bulk-price-import" className={buttonClass("secondary")}>
              {t("page.bulkImportButton")}
            </a>
          )}
          <ButtonAnchor href="/api/export/licenses">
            {t("page.exportCsv")}
          </ButtonAnchor>
        </div>
      </header>

      {!priceCoverage.complete && priceCoverage.totalProducts > 0 && (
        <section className="rise rise-2 mt-6">
          <PriceAccuracyCard coverage={priceCoverage} />
        </section>
      )}

      <form className="rise rise-2 border-line bg-card mt-6 flex flex-col gap-3 border p-4 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium">
          {t("page.searchLabel")}
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoComplete="off"
            placeholder={t("page.searchPlaceholder")}
            className="border-line bg-card min-h-11 border px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("page.priceStatusLabel")}
          <select
            name="pricing"
            defaultValue={pricingFilter}
            autoComplete="off"
            className="border-line bg-card min-h-11 border px-3 py-2 text-sm font-normal"
          >
            <option value="all">{t("page.priceStatus.all")}</option>
            <option value="unpriced">{t("page.priceStatus.unpriced")}</option>
            <option value="estimate">{t("page.priceStatus.estimate")}</option>
            <option value="custom">{t("page.priceStatus.custom")}</option>
          </select>
        </label>
        <button className="border-ink bg-ink text-canvas hover:bg-ink-soft min-h-11 border px-4 py-2 text-sm font-medium">
          {t("page.applyFilters")}
        </button>
      </form>

      {/* Desktop table */}
      <div className="rise rise-2 border-line bg-card mt-8 mb-8 hidden overflow-x-auto border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line text-ink-faint border-b text-left text-[11px] tracking-[0.14em] uppercase">
              <th scope="col" className="px-4 py-3 font-medium">
                {t("page.table.product")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("page.table.purchased")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("page.table.assigned")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("page.table.unassigned")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("page.table.spendPerMonth")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("page.table.priceSource")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("page.table.pricePerSeatPerMonth")}
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
                  className="border-line hover:bg-canvas border-b last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {s.displayName ?? s.skuPartNumber}
                    </div>
                    <div className="text-ink-faint font-mono text-[11px]">
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
                      free > 0
                        ? "text-waste-text font-medium"
                        : "text-ink-faint"
                    }`}
                  >
                    {fmtNumber(free, currency)}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono">
                    {fmtMoney(s.consumedUnits * cents, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <PriceSourcePill price={p} t={t} />
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
                  <EmptyState icon={PackageOpen} heading={tableEmptyHeading}>
                    {tableEmptyMessage}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="border-line text-ink-faint border-t-2 text-[11px] tracking-[0.14em] uppercase">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  {t("page.table.total")}
                </th>
                <td className="tnum text-ink px-4 py-3 text-right font-mono">
                  {fmtNumber(totals.purchased, currency)}
                </td>
                <td className="tnum text-ink px-4 py-3 text-right font-mono">
                  {fmtNumber(totals.assigned, currency)}
                </td>
                <td
                  className={`tnum px-4 py-3 text-right font-mono ${
                    totals.unassigned > 0
                      ? "text-waste-text font-medium"
                      : "text-ink"
                  }`}
                >
                  {fmtNumber(totals.unassigned, currency)}
                </td>
                <td className="tnum text-ink px-4 py-3 text-right font-mono font-semibold">
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
            <li key={s.skuId} className="border-line bg-card border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {s.displayName ?? s.skuPartNumber}
                  </div>
                  <div className="text-ink-faint font-mono text-[11px]">
                    {s.skuPartNumber}
                  </div>
                </div>
                <PriceSourcePill price={p} t={t} />
              </div>
              <dl className="tnum mt-3 grid grid-cols-1 gap-x-6 gap-y-2 font-mono text-sm min-[360px]:grid-cols-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint font-sans text-xs">
                    {t("page.mobile.purchased")}
                  </dt>
                  <dd>{fmtNumber(s.prepaidEnabled, currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint font-sans text-xs">
                    {t("page.mobile.assigned")}
                  </dt>
                  <dd>{fmtNumber(s.consumedUnits, currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint font-sans text-xs">
                    {t("page.mobile.unassigned")}
                  </dt>
                  <dd
                    className={
                      unassignedOf(s) > 0 ? "text-waste-text font-medium" : ""
                    }
                  >
                    {fmtNumber(unassignedOf(s), currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint font-sans text-xs">
                    {t("page.mobile.spendPerMonth")}
                  </dt>
                  <dd>{fmtMoney(s.consumedUnits * cents, currency)}</dd>
                </div>
              </dl>
              <div className="border-line mt-3 border-t pt-3">
                {isAdmin ? (
                  <PriceEditor
                    skuId={s.skuId}
                    name={s.displayName ?? s.skuPartNumber}
                    initial={(cents / 100).toFixed(2)}
                    currency={currency}
                  />
                ) : (
                  <div className="tnum text-right font-mono text-sm">
                    {t("page.mobile.perSeatPerMonth", {
                      price: fmtMoney(cents, currency),
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="border-line bg-card border">
            <EmptyState icon={PackageOpen} heading={tableEmptyHeading}>
              {tableEmptyMessage}
            </EmptyState>
          </li>
        )}
        {sorted.length > 0 && (
          <li className="border-line bg-card border p-4">
            <dl className="tnum grid grid-cols-1 gap-x-6 gap-y-2 font-mono text-sm min-[360px]:grid-cols-2">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-faint font-sans text-xs font-medium uppercase">
                  {t("page.mobile.totalPurchased")}
                </dt>
                <dd>{fmtNumber(totals.purchased, currency)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-faint font-sans text-xs font-medium uppercase">
                  {t("page.mobile.totalAssigned")}
                </dt>
                <dd>{fmtNumber(totals.assigned, currency)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-faint font-sans text-xs font-medium uppercase">
                  {t("page.mobile.totalUnassigned")}
                </dt>
                <dd
                  className={
                    totals.unassigned > 0 ? "text-waste-text font-medium" : ""
                  }
                >
                  {fmtNumber(totals.unassigned, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-faint font-sans text-xs font-medium uppercase">
                  {t("page.mobile.totalSpendPerMonth")}
                </dt>
                <dd className="font-semibold">
                  {fmtMoney(totals.spendCents, currency)}
                </dd>
              </div>
            </dl>
          </li>
        )}
      </ul>

      {adobeProducts.length > 0 && (
        <section
          id="bulk-price-import"
          className="rise rise-3 mb-8 scroll-mt-24"
        >
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
            {t("page.adobe.heading")}
          </h2>
          <p className="text-ink-soft mt-1 max-w-2xl text-sm">
            {t("page.adobe.description")}
          </p>
          <ul className="border-line bg-card mt-3 border">
            {adobeProducts.map(([product, count]) => {
              const p = priceRows.get(adobePriceKey(product));
              const cents = p?.monthlyPriceCents ?? 0;
              return (
                <li
                  key={product}
                  className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{product}</span>
                    <span className="tnum text-ink-soft ml-3 font-mono text-sm">
                      {t("page.seatsCount", { count: fmtNumber(count, currency) })}
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
                      {t("page.perSeatPerMonth", {
                        price: fmtMoney(cents, currency),
                      })}
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
          <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
            {t("page.saas.heading", { label })}
          </h2>
          <p className="text-ink-soft mt-1 max-w-2xl text-sm">
            {t("page.saas.description", { label })}
          </p>
          <ul className="border-line bg-card mt-3 border">
            {products.map(([product, count]) => {
              const p = priceRows.get(saasPriceKey(provider, product));
              const cents = p?.monthlyPriceCents ?? 0;
              return (
                <li
                  key={product}
                  className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{product}</span>
                    <span className="tnum text-ink-soft ml-3 font-mono text-sm">
                      {t("page.seatsCount", { count: fmtNumber(count, currency) })}
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
                      {t("page.perSeatPerMonth", {
                        price: fmtMoney(cents, currency),
                      })}
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
            <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
              {t("page.bulkImport.heading")}
            </h2>

            <a
              href="/api/export/pricebook"
              className="text-ink-soft hover:text-ink text-xs underline-offset-4 hover:underline"
            >
              {t("page.bulkImport.exportPriceBook")}
            </a>
          </div>
          <p className="text-ink-soft mt-1 max-w-2xl text-sm">
            {t("page.bulkImport.description")}
          </p>
          <div className="border-line bg-card mt-3 border p-4">
            <ImportPricesForm />
          </div>
        </section>
      )}
    </div>
  );
}
