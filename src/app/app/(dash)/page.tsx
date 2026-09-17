import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ButtonAnchor, ButtonLink, Card } from "~/components/ui";
import { FindingChip } from "~/components/workspace/FindingChip";
import { InventoryTable } from "~/components/workspace/InventoryTable";
import {
  MetricCards,
  type BreakdownRow,
  type MetricCardData,
} from "~/components/workspace/MetricCards";
import { OnboardingEmptyState } from "~/components/workspace/OnboardingEmptyState";
import { PriceAccuracyCard } from "~/components/workspace/PriceAccuracyCard";
import { SyncNowButton } from "~/components/workspace/SyncNowButton";
import { TrendChart } from "~/components/workspace/TrendChart";
import { Tour } from "~/components/workspace/Tour";
import {
  getDataTourSteps,
  getWelcomeTourSteps,
} from "~/components/workspace/tourSteps";
import { fmtAgo, fmtDate, fmtMoney, fmtNumber } from "~/lib/format";
import { calculatePriceCoverage } from "~/lib/priceCoverage";
import { ALL_RULES, RULE_META } from "~/lib/rules";
import type { WasteRuleId } from "~/server/types";
import { requireAccess, hasRole } from "~/server/access";
import { db } from "~/server/db";
import { workspaceHasConnectorOrData } from "~/server/workspaceState";
import { daysUntilDate } from "~/server/digestDelta";
import { isShelfwareExempt } from "~/server/waste/engine";
import {
  findings,
  priceBook,
  snapshots,
  syncRuns,
  tenantSkus,
  tenantUsers,
  vendorRenewals,
} from "~/server/db/schema";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const ctx = await requireAccess("viewer");
  const tenantId = ctx.tenant.id;
  const t = await getTranslations("dashboardHome.page");
  const tm = await getTranslations("dashboardHome.metricCardsData");
  const tTour = await getTranslations("tour");
  const dataTourSteps = getDataTourSteps(tTour);
  const welcomeTourSteps = getWelcomeTourSteps(tTour);

  // Workspace-first onboarding: a workspace that has connected no service yet
  // lands on the dashboard but sees the onboarding empty state (nudge to connect
  // a first service) instead of a dashboard of zeros. Demo always has data.
  const hasConnectorOrData =
    ctx.tenant.isDemo || (await workspaceHasConnectorOrData(tenantId));
  if (!hasConnectorOrData) {
    return (
      <>
        <OnboardingEmptyState />
        {ctx.membership.welcomeTourAt === null && (
          <Tour
            phase="welcome"
            storageId={ctx.membership.id}
            steps={welcomeTourSteps}
            finalButtonLabel="Got it"
          />
        )}
      </>
    );
  }
  const currency = ctx.tenant.currency;
  // CSV/scan imports never get syncRuns rows; their freshness signal is the
  // import time on the user snapshots.
  const isImported = !ctx.tenant.consentedAt && !ctx.tenant.isDemo;

  const openFindingsWhere = and(
    eq(findings.tenantId, tenantId),
    inArray(findings.status, ["open", "acknowledged"]),
  );

  const [
    skus,
    prices,
    topFindings,
    ruleAgg,
    lastRun,
    importedUser,
    historyDesc,
    resolvedSavings,
    upcomingRenewals,
  ] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, tenantId) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, tenantId) }),
    // Only the rows the dashboard actually renders ("Largest open findings").
    // Headline figures come from the grouped aggregate below, so a large
    // tenant never streams every finding row into the page.
    db.query.findings.findMany({
      where: openFindingsWhere,
      orderBy: desc(findings.monthlyImpactCents),
      limit: 6,
    }),
    // Per-rule count + impact, summed in Postgres. Drives the metric cards
    // and every breakdown table without loading individual finding rows.
    db
      .select({
        rule: findings.rule,
        count: sql<number>`count(*)::int`,
        cents: sql<number>`coalesce(sum(${findings.monthlyImpactCents}), 0)::int`,
      })
      .from(findings)
      .where(openFindingsWhere)
      .groupBy(findings.rule),
    db.query.syncRuns.findFirst({
      where: eq(syncRuns.tenantId, tenantId),
      orderBy: desc(syncRuns.startedAt),
    }),
    isImported
      ? db.query.tenantUsers.findFirst({
          where: eq(tenantUsers.tenantId, tenantId),
          orderBy: desc(tenantUsers.syncedAt),
        })
      : Promise.resolve(undefined),
    // Newest 90 days, reversed below into ascending order for the chart.
    // Ascending with a limit would pin the window to the oldest days ever
    // collected.
    db.query.snapshots.findMany({
      where: eq(snapshots.tenantId, tenantId),
      orderBy: desc(snapshots.day),
      limit: 90,
    }),
    db
      .select({
        count: sql<number>`count(*)::int`,
        cents: sql<number>`coalesce(sum(${findings.monthlyImpactCents}), 0)::int`,
      })
      .from(findings)
      .where(
        and(
          eq(findings.tenantId, tenantId),
          eq(findings.status, "resolved"),
          gte(findings.resolvedAt, new Date(Date.now() - 30 * 86_400_000)),
        ),
      )
      .then((rows) => rows[0] ?? { count: 0, cents: 0 }),
    db.query.vendorRenewals.findMany({
      where: and(
        eq(vendorRenewals.tenantId, tenantId),
        gte(vendorRenewals.renewalDate, new Date().toISOString().slice(0, 10)),
      ),
      orderBy: asc(vendorRenewals.renewalDate),
      limit: 3,
    }),
  ]);

  const history = [...historyDesc].reverse();

  const priceBySku = new Map(prices.map((p) => [p.skuId, p.monthlyPriceCents]));

  // Real, purchased SKUs only. Microsoft auto-provisions free/viral/capacity
  // sentinels (WINDOWS_STORE's 1,000,000 prepaid units, FLOW_FREE, etc.) into
  // every tenant; they carry no cost and only add noise. Excluding them here —
  // the same exemption the waste engine and seat-tier gate already use — keeps
  // the spend total, the assigned-seat count and the inventory table all
  // reconciled to one set of SKUs.
  const realSkus = skus.filter(
    (s) => !isShelfwareExempt(s.skuPartNumber, s.prepaidEnabled),
  );

  const monthlySpend = realSkus.reduce(
    (sum, s) => sum + s.consumedUnits * (priceBySku.get(s.skuId) ?? 0),
    0,
  );
  const monthlyWaste = ruleAgg.reduce((sum, r) => sum + r.cents, 0);
  const wasteShare = monthlySpend > 0 ? (monthlyWaste / monthlySpend) * 100 : 0;

  // Inventory rows for the dashboard table, sorted client-side (default: spend
  // descending). Pre-shaped here so the client component stays serializable.
  const inventoryRows = realSkus.map((s) => ({
    skuId: s.skuId,
    name: s.displayName ?? s.skuPartNumber,
    partNumber: s.skuPartNumber,
    purchased: s.prepaidEnabled,
    assigned: s.consumedUnits,
    spendCents: s.consumedUnits * (priceBySku.get(s.skuId) ?? 0),
  }));

  const priceRowsBySku = new Map(prices.map((p) => [p.skuId, p]));
  const priceCoverage = calculatePriceCoverage(
    realSkus.map((s) => {
      const price = priceRowsBySku.get(s.skuId);
      return {
        seats: s.consumedUnits,
        priceCents: price?.monthlyPriceCents ?? 0,
        source: price?.source,
      };
    }),
  );

  const nextRenewal = upcomingRenewals[0] ?? null;
  const renewalDays = daysUntilDate(
    nextRenewal?.renewalDate ?? null,
    new Date(),
  );
  const noticeDaysUntil =
    renewalDays === null ? null : renewalDays - (nextRenewal?.noticeDays ?? 0);
  const openCount = ruleAgg.reduce((sum, r) => sum + r.count, 0);

  // A partial sync finished but some steps degraded to warnings/failures (e.g.
  // a usage report was unavailable). Surface the count so admins know figures
  // may be incomplete without digging into the sync log.
  const degradedSteps =
    lastRun?.steps.filter(
      (s) => s.status === "warning" || s.status === "failed",
    ).length ?? 0;

  // Imported workspaces have no sync button, so do not tell them to run one.
  const emptyInventory = isImported
    ? t("emptyInventoryImported")
    : t("emptyInventorySync");

  // Drill-down rows for each metric card. Each breakdown is derived from the
  // exact same inputs as the headline figure, so the rows always sum to the
  // number on the card.
  const assignedSeats = realSkus.reduce((s, x) => s + x.consumedUnits, 0);

  // Spend by product: zero-cost SKUs (free/viral sentinels) drop out, leaving
  // only rows that actually contribute to monthly spend.
  const spendRows: BreakdownRow[] = realSkus
    .map((s) => ({
      sku: s,
      price: priceBySku.get(s.skuId) ?? 0,
      cents: s.consumedUnits * (priceBySku.get(s.skuId) ?? 0),
    }))
    .filter((r) => r.cents > 0)
    .sort((a, b) => b.cents - a.cents)
    .map((r) => ({
      label: r.sku.displayName ?? r.sku.skuPartNumber,
      sub: tm("spendRowSub", {
        units: fmtNumber(r.sku.consumedUnits, currency),
        price: fmtMoney(r.price, currency),
      }),
      value: fmtMoney(r.cents, currency),
    }));

  // Findings grouped by rule, the shared basis for the waste, annualized-waste
  // and open-findings breakdowns.
  const byRule = new Map<WasteRuleId, { count: number; cents: number }>();
  for (const r of ruleAgg) {
    byRule.set(r.rule, { count: r.count, cents: r.cents });
  }
  const ruleEntries = [...byRule.entries()].sort(
    (a, b) => b[1].cents - a[1].cents || b[1].count - a[1].count,
  );
  const ruleLabel = (r: WasteRuleId) => RULE_META[r]?.label ?? r;

  const wasteRows: BreakdownRow[] = ruleEntries.map(([rule, agg]) => ({
    label: ruleLabel(rule),
    sub: tm("wasteRowSub", { count: agg.count }),
    value: fmtMoney(agg.cents, currency),
    tone: agg.cents > 0 ? "waste" : "ink",
  }));
  const annualRows: BreakdownRow[] = ruleEntries.map(([rule, agg]) => ({
    label: ruleLabel(rule),
    sub: tm("annualRowSub", { amount: fmtMoney(agg.cents, currency) }),
    value: fmtMoney(agg.cents * 12, currency),
    tone: agg.cents > 0 ? "waste" : "ink",
  }));
  const findingRows: BreakdownRow[] = ruleEntries.map(([rule, agg]) => ({
    label: ruleLabel(rule),
    sub:
      agg.cents > 0
        ? tm("findingRowSub", { amount: fmtMoney(agg.cents, currency) })
        : undefined,
    value: fmtNumber(agg.count, currency),
  }));

  const listPriceFootnote = !priceCoverage.complete
    ? tm("priceCoverageFootnote", {
        custom: priceCoverage.customProducts,
        total: priceCoverage.totalProducts,
      })
    : undefined;

  const metricCards: MetricCardData[] = [
    {
      key: "spend",
      label: tm("spend.label"),
      value: fmtMoney(monthlySpend, currency),
      sub: tm("spend.sub", { count: fmtNumber(assignedSeats, currency) }),
      tone: "ink",
      explainer: tm("spend.explainer"),
      detail: {
        formula: tm("spend.formula"),
        source: tm("spend.source"),
        columns: [tm("spend.column1"), tm("spend.column2")],
        rows: spendRows,
        totalLabel: tm("spend.totalLabel"),
        totalValue: fmtMoney(monthlySpend, currency),
        emptyText: tm("spend.emptyText"),
      },
    },
    {
      key: "waste",
      label: tm("waste.label"),
      value: fmtMoney(monthlyWaste, currency),
      sub: tm("waste.subPercent", { pct: wasteShare.toFixed(1) }),
      tone: "waste",
      note: !priceCoverage.complete ? (
        <>
          {tm("waste.notePrefix")}{" "}
          <Link
            href="/app/licenses"
            className="hover:text-ink underline underline-offset-4"
          >
            {tm("waste.setPrices")}
          </Link>
        </>
      ) : null,
      explainer: tm("waste.explainer"),
      detail: {
        formula: tm("waste.formula"),
        source: tm("waste.source"),
        columns: [tm("waste.column1"), tm("waste.column2")],
        rows: wasteRows,
        totalLabel: tm("waste.totalLabel"),
        totalValue: fmtMoney(monthlyWaste, currency),
        emptyText: tm("waste.emptyText"),
        footnote: listPriceFootnote,
      },
    },
    {
      key: "annual",
      label: tm("annual.label"),
      value: fmtMoney(monthlyWaste * 12, currency),
      sub: tm("annual.sub"),
      tone: "waste",
      explainer: tm("annual.explainer"),
      detail: {
        formula: tm("annual.formula"),
        source: tm("annual.source"),
        columns: [tm("annual.column1"), tm("annual.column2")],
        rows: annualRows,
        totalLabel: tm("annual.totalLabel"),
        totalValue: fmtMoney(monthlyWaste * 12, currency),
        emptyText: tm("annual.emptyText"),
        footnote: listPriceFootnote,
      },
    },
    {
      key: "findings",
      label: tm("findings.label"),
      value: fmtNumber(openCount, currency),
      sub: tm("findings.sub", { count: ALL_RULES.length }),
      tone: "ink",
      explainer: tm("findings.explainer"),
      detail: {
        formula: tm("findings.formula"),
        source: tm("findings.source", { count: ALL_RULES.length }),
        columns: [tm("findings.column1"), tm("findings.column2")],
        rows: findingRows,
        totalLabel: tm("findings.totalLabel"),
        totalValue: fmtNumber(openCount, currency),
        emptyText: tm("findings.emptyText"),
        footnote: tm("findings.footnote", {
          withFindings: ruleEntries.length,
          total: ALL_RULES.length,
        }),
      },
    },
    {
      key: "savings",
      label: tm("savings.label"),
      value: fmtMoney(resolvedSavings.cents, currency),
      sub: tm("savings.sub", { count: resolvedSavings.count }),
      tone: "ink",
      explainer: tm("savings.explainer"),
      detail: {
        formula: tm("savings.formula"),
        source: tm("savings.source"),
        columns: [tm("savings.column1"), tm("savings.column2")],
        rows: [
          {
            label: tm("savings.annualizedLabel"),
            sub: tm("savings.annualizedSub", {
              amount: fmtMoney(resolvedSavings.cents, currency),
            }),
            value: fmtMoney(resolvedSavings.cents * 12, currency),
          },
        ],
        totalLabel: tm("savings.totalLabel"),
        totalValue: fmtMoney(resolvedSavings.cents, currency),
        emptyText: tm("savings.emptyText"),
      },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {ctx.membership.dataTourAt === null && (
        <Tour
          phase="data"
          storageId={ctx.membership.id}
          steps={dataTourSteps}
          finalButtonLabel="Done"
        />
      )}
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {t("title")}
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            {lastRun?.status === "running"
              ? t("syncRunning")
              : isImported
                ? t("importedOn", {
                    date: fmtDate(importedUser?.syncedAt ?? null),
                  })
                : t("lastSynced", {
                    time: fmtAgo(lastRun?.finishedAt ?? null),
                  })}
            {lastRun?.status === "failed" && (
              <span className="text-danger-text ml-2">
                {t("lastSyncFailed")}
              </span>
            )}
            {lastRun?.status === "partial" && (
              <span className="text-gold-text ml-2">
                {t("completedWithWarnings")}
                {degradedSteps > 0
                  ? ` · ${t("stepsDegraded", { count: degradedSteps })}`
                  : ""}
                {t("closeParen")}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonAnchor href="/api/export/report">
            {t("pdfReport")}
          </ButtonAnchor>
          {/* Imported workspaces (consentedAt null) have no Graph access: a
                  manual sync could only fail. Demo tenants have consentedAt set. */}
          {hasRole(ctx, "admin") && ctx.tenant.consentedAt && <SyncNowButton />}
        </div>
      </header>

      {!ctx.tenant.consentedAt && !ctx.tenant.isDemo && (
        <section className="rise rise-2 mt-8">
          <Card title={t("importedWorkspace.title")}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-ink-soft max-w-2xl text-sm">
                {t("importedWorkspace.body")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonLink variant="primary" href="/app/connectors/microsoft">
                  {t("importedWorkspace.connectSync")}
                </ButtonLink>
                <ButtonAnchor href="/api/scan/start">
                  {t("importedWorkspace.rerunScan")}
                </ButtonAnchor>
                <ButtonLink href="/app/connect/csv">
                  {t("importedWorkspace.uploadExports")}
                </ButtonLink>
              </div>
            </div>
          </Card>
        </section>
      )}

      {renewalDays !== null && renewalDays < 0 && (
        <p className="rise rise-2 text-ink-faint mt-8 text-sm">
          {t("renewalPassed")}{" "}
          <Link
            href="/app/renewals"
            className="hover:text-ink underline underline-offset-4"
          >
            {t("updateInRenewals")}
          </Link>
          .
        </p>
      )}
      {renewalDays !== null &&
        noticeDaysUntil !== null &&
        renewalDays >= 0 &&
        noticeDaysUntil <= 90 && (
          <section className="rise rise-2 mt-8">
            <Card title={t("renewalWindow.title")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-display text-2xl tracking-tight">
                    {renewalDays === 0
                      ? t("renewalWindow.today")
                      : t("renewalWindow.inDays", {
                          vendor: nextRenewal?.vendor ?? "",
                          days: renewalDays,
                        })}
                  </div>
                  <p className="text-ink-soft mt-1 text-sm">
                    {t("renewalWindow.openFindingsWorth", {
                      contractName: nextRenewal?.contractName ?? "",
                      count: openCount,
                    })}{" "}
                    <span className="text-waste-text font-medium">
                      {fmtMoney(monthlyWaste, currency)}/mo
                    </span>
                    . {t("renewalWindow.reclaim")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href="/app/findings">
                    {t("renewalWindow.reviewFindings")}
                  </ButtonLink>
                  <ButtonLink href="/app/renewals">
                    {t("renewalWindow.renewalCalendar")}
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </section>
        )}

      <MetricCards cards={metricCards} />

      {!priceCoverage.complete && priceCoverage.totalProducts > 0 && (
        <section className="rise rise-2 mt-6">
          <PriceAccuracyCard coverage={priceCoverage} />
        </section>
      )}

      <section className="rise rise-3 mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
              {t("nextActions.heading")}
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              {t("nextActions.subtitle")}
            </p>
          </div>
          <Link
            href="/app/findings"
            className="text-ink-soft hover:text-ink text-xs underline-offset-4 hover:underline"
          >
            {t("nextActions.allFindings")}
          </Link>
        </div>
        <ul className="border-line bg-card mt-3 border">
          {topFindings.map((f) => (
            <li key={f.id} className="border-line border-b last:border-b-0">
              <Link
                href={`/app/findings/${f.id}`}
                className="group hover:bg-canvas flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FindingChip rule={f.rule} detail={f.detail} />
                  <span className="truncate text-sm underline-offset-4 group-hover:underline">
                    {f.title}
                  </span>
                </div>
                <span className="tnum text-waste-text shrink-0 font-mono text-sm font-medium">
                  {f.monthlyImpactCents > 0
                    ? `${fmtMoney(f.monthlyImpactCents, currency)}/mo`
                    : "-"}
                </span>
              </Link>
            </li>
          ))}
          {topFindings.length === 0 && (
            <li className="text-ink-soft px-4 py-8 text-center text-sm">
              {t("nextActions.empty")}
            </li>
          )}
        </ul>
      </section>

      <TrendChart
        currency={currency}
        points={history.map((s) => ({
          day: s.day,
          spendCents: s.totalMonthlySpendCents,
          wasteCents: s.totalMonthlyWasteCents,
        }))}
      />

      <InventoryTable
        rows={inventoryRows}
        currency={currency}
        emptyText={emptyInventory}
      />
    </div>
  );
}
