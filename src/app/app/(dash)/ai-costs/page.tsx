import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ButtonLink, Card } from "~/components/ui";
import { SpendChart } from "~/components/workspace/SpendChart";
import { SyncNowButton } from "~/components/workspace/SyncNowButton";
import { CONNECTOR_LABELS } from "~/lib/connectors";
import { fmtAgo, fmtDate, fmtMoney } from "~/lib/format";
import { hasRole, requireAccess } from "~/server/access";
import { db } from "~/server/db";
import {
  aiSpendDaily,
  saasConnections,
  syncRuns,
  tenantUsers,
} from "~/server/db/schema";
import type { SaasProvider } from "~/server/types";
import {
  AI_PREVIEW_PROVIDERS,
  getAiPreview,
  shouldPreviewAi,
} from "~/server/demo/aiPreview";
import { AiSampleNotice } from "~/components/workspace/AiSampleNotice";

export const metadata: Metadata = { title: "AI costs" };

/** The connectors that report daily API spend, in display order. */
const AI_PROVIDERS: SaasProvider[] = ["openai", "anthropic"];

/** UTC day string (yyyy-mm-dd) n days before now. aiSpendDaily buckets by UTC day. */
const dayAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

export default async function AiCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const t = await getTranslations("aiCosts");
  const ctx = await requireAccess("viewer");
  const tenantId = ctx.tenant.id;
  const isAdmin = hasRole(ctx, "admin");
  // CSV/scan imports never get syncRuns rows and cannot sync connectors;
  // their freshness signal is the import time on the user snapshots.
  const isImported = !ctx.tenant.consentedAt && !ctx.tenant.isDemo;

  const [storedRows, aiConns, lastRun, importedUser] = await Promise.all([
    db.query.aiSpendDaily.findMany({
      where: and(
        eq(aiSpendDaily.tenantId, tenantId),
        gte(aiSpendDaily.day, dayAgo(90)),
      ),
      orderBy: aiSpendDaily.day,
      // Only the fields the page reduces over; skip ids/timestamps.
      columns: { provider: true, day: true, category: true, amountCents: true },
    }),
    db.query.saasConnections.findMany({
      where: and(
        eq(saasConnections.tenantId, tenantId),
        inArray(saasConnections.provider, AI_PROVIDERS),
      ),
    }),
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
  ]);

  const isPreview = shouldPreviewAi({
    isDemo: ctx.tenant.isDemo,
    requested: (await searchParams).preview === "sample",
    hasConnection: aiConns.length > 0,
    hasData: storedRows.length > 0,
  });
  const rows = isPreview
    ? (await Promise.all(AI_PREVIEW_PROVIDERS.map(getAiPreview))).flatMap(
        (p) => p.spend,
      )
    : storedRows;

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const cutoff30 = dayAgo(30);
  const providers = AI_PROVIDERS.filter((p) =>
    rows.some((r) => r.provider === p),
  );

  const totalFor = (
    provider: SaasProvider,
    inWindow: (day: string) => boolean,
  ) =>
    rows
      .filter((r) => r.provider === provider && inWindow(r.day))
      .reduce((sum, r) => sum + r.amountCents, 0);

  const perProviderCards = providers.flatMap((p) => [
    {
      label: t("stats.thisMonth", { provider: CONNECTOR_LABELS[p] }),
      value: fmtMoney(
        totalFor(p, (d) => d.startsWith(monthPrefix)),
        "USD",
      ),
      sub: t("stats.calendarMonthSub"),
    },
    {
      label: t("stats.last30Days", { provider: CONNECTOR_LABELS[p] }),
      value: fmtMoney(
        totalFor(p, (d) => d >= cutoff30),
        "USD",
      ),
      sub: t("stats.rollingWindowSub"),
    },
  ]);

  // Combined headline totals across every connected provider, so the page
  // answers "what do we spend on AI?" without summing the cards by hand. Only
  // shown when more than one provider is connected (otherwise it duplicates the
  // single provider's cards).
  const totalCards =
    providers.length > 1
      ? [
          {
            label: t("stats.totalThisMonth"),
            value: fmtMoney(
              providers.reduce(
                (s, p) => s + totalFor(p, (d) => d.startsWith(monthPrefix)),
                0,
              ),
              "USD",
            ),
            sub: t("stats.totalCalendarMonthSub"),
          },
          {
            label: t("stats.totalLast30Days"),
            value: fmtMoney(
              providers.reduce(
                (s, p) => s + totalFor(p, (d) => d >= cutoff30),
                0,
              ),
              "USD",
            ),
            sub: t("stats.totalRollingWindowSub"),
          },
        ]
      : [];
  const statCards = [...totalCards, ...perProviderCards];

  // Surface a partial sync (some steps degraded) like the Overview header does.
  const degradedSteps =
    lastRun?.steps.filter(
      (s) => s.status === "warning" || s.status === "failed",
    ).length ?? 0;
  // Admins on a connected workspace with sync enabled get a manual sync, matching the
  // Overview header.
  const canSync = !isPreview && isAdmin && Boolean(ctx.tenant.consentedAt);

  // One chart series per provider: spend summed across categories per day.
  const series = providers.map((p) => ({
    label: CONNECTOR_LABELS[p],
    points: [
      ...rows
        .filter((r) => r.provider === p)
        .reduce(
          (m, r) => m.set(r.day, (m.get(r.day) ?? 0) + r.amountCents),
          new Map<string, number>(),
        ),
    ].map(([day, cents]) => ({ day, cents })),
  }));

  // Top categories by last-30-day total across providers; the rest is "Other".
  const byCategory = new Map<
    string,
    { provider: SaasProvider; category: string; cents: number }
  >();
  for (const r of rows) {
    if (r.day < cutoff30) continue;
    const key = `${r.provider}:${r.category}`;
    const entry = byCategory.get(key);
    if (entry) entry.cents += r.amountCents;
    else
      byCategory.set(key, {
        provider: r.provider,
        category: r.category,
        cents: r.amountCents,
      });
  }
  const categories = [...byCategory.values()].sort((a, b) => b.cents - a.cents);
  const topCategories = categories.slice(0, 8);
  const otherCents = categories.slice(8).reduce((sum, c) => sum + c.cents, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {t("header.title")}
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            {isPreview
              ? t("header.previewSubtitle")
              : lastRun?.status === "running"
                ? t("header.syncRunning")
                : isImported
                  ? t("header.imported", {
                      date: fmtDate(importedUser?.syncedAt ?? null),
                    })
                  : t("header.lastSynced", {
                      when: fmtAgo(lastRun?.finishedAt ?? null),
                    })}
            {!isPreview && lastRun?.status === "failed" && (
              <span className="text-danger-text ml-2">
                {t("header.syncFailed")}
              </span>
            )}
            {!isPreview && lastRun?.status === "partial" && (
              <span className="text-gold-text ml-2">
                {t("header.completedWithWarnings", {
                  detail:
                    degradedSteps > 0
                      ? t("header.stepsDegraded", { count: degradedSteps })
                      : "",
                })}
              </span>
            )}
          </p>
        </div>
        {canSync && rows.length > 0 && <SyncNowButton />}
      </header>

      {isPreview && (
        <>
          <AiSampleNotice
            exitHref={ctx.tenant.isDemo ? undefined : "/app/ai-costs"}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {AI_PREVIEW_PROVIDERS.map((provider) => (
              <ButtonLink
                key={provider}
                href={`/app/connectors/${provider}${ctx.tenant.isDemo ? "" : "?preview=sample"}`}
              >
                {t("exploreSample", { label: CONNECTOR_LABELS[provider] })}
              </ButtonLink>
            ))}
          </div>
        </>
      )}

      {rows.length === 0 && aiConns.length === 0 ? (
        <section className="rise rise-2 mt-8">
          <Card title={t("connect.title")}>
            <div className="flex flex-col gap-4">
              <div>
                <ButtonLink
                  href="/app/ai-costs?preview=sample"
                  variant="secondary"
                >
                  {t("connect.previewButton")}
                </ButtonLink>
              </div>
              <p className="text-ink-soft max-w-2xl text-sm">
                {t("connect.description")}
              </p>
              {isImported ? (
                <>
                  <p className="text-ink-soft max-w-2xl text-sm">
                    {t("connect.connectM365First")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href="/app/connectors/microsoft">
                      {t("connect.connectReadOnlySync")}
                    </ButtonLink>
                  </div>
                </>
              ) : !isAdmin ? (
                <p className="text-ink-soft max-w-2xl text-sm">
                  {t.rich("connect.adminRequired", {
                    openai: (chunks) => (
                      <Link
                        href="/app/connectors/openai"
                        className="hover:text-ink underline underline-offset-4"
                      >
                        {chunks}
                      </Link>
                    ),
                    anthropic: (chunks) => (
                      <Link
                        href="/app/connectors/anthropic"
                        className="hover:text-ink underline underline-offset-4"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href="/app/connectors/openai">
                    {t("connect.connectOpenAI")}
                  </ButtonLink>
                  <ButtonLink href="/app/connectors/anthropic">
                    {t("connect.connectAnthropic")}
                  </ButtonLink>
                </div>
              )}
            </div>
          </Card>
        </section>
      ) : rows.length === 0 ? (
        <section className="rise rise-2 mt-8">
          <Card title={t("connection.title")}>
            <div className="flex flex-col gap-3">
              <p className="text-ink-soft text-sm">
                {t("connection.description")}
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {aiConns.map((c) => (
                  <li
                    key={c.provider}
                    className="text-ink-soft flex flex-wrap items-center justify-between gap-2"
                  >
                    <Link
                      href={`/app/connectors/${c.provider}`}
                      className="text-ink font-medium underline-offset-4 hover:underline"
                    >
                      {CONNECTOR_LABELS[c.provider] ?? c.provider}
                    </Link>
                    <span className="text-ink-faint text-xs">
                      {c.lastSyncAt
                        ? t("connection.lastSync", {
                            date: fmtDate(c.lastSyncAt),
                            status: c.lastSyncStatus ?? "pending",
                          })
                        : t("connection.firstSyncPending")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>
      ) : (
        <>
          <section
            className={`rise rise-2 border-line bg-line mt-8 grid gap-px border sm:grid-cols-2 ${statCards.length > 4 ? "lg:grid-cols-3" : ""}`}
          >
            {statCards.map((card) => (
              <div key={card.label} className="bg-card p-5">
                <div className="text-ink-faint text-[11px] font-medium tracking-[0.16em] uppercase">
                  {card.label}
                </div>
                <div className="tnum font-display mt-2 text-3xl tracking-tight">
                  {card.value}
                </div>
                <div className="text-ink-soft mt-1 text-xs">{card.sub}</div>
              </div>
            ))}
          </section>

          <SpendChart series={series} sample={isPreview} />

          <section className="rise rise-4 mt-10">
            <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
              {t("categories.title")}
            </h2>
            {/* Desktop table */}
            <div className="border-line bg-card mt-3 hidden overflow-x-auto border md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  {t("categories.tableCaption", {
                    sample: isPreview
                      ? t("categories.sampleDataSuffix")
                      : "",
                  })}
                </caption>
                <thead>
                  <tr className="border-line text-ink-faint border-b text-left text-[11px] tracking-[0.14em] uppercase">
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t("categories.columnCategory")}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t("categories.columnProvider")}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      {t("categories.columnLast30Days")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map((c) => (
                    <tr
                      key={`${c.provider}:${c.category}`}
                      className="border-line hover:bg-canvas border-b last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium">{c.category}</td>
                      <td className="text-ink-soft px-4 py-3">
                        {CONNECTOR_LABELS[c.provider]}
                      </td>
                      <td className="tnum px-4 py-3 text-right font-mono">
                        {fmtMoney(c.cents, "USD")}
                      </td>
                    </tr>
                  ))}
                  {otherCents > 0 && (
                    <tr className="border-line hover:bg-canvas border-b last:border-b-0">
                      <td className="text-ink-soft px-4 py-3">
                        {t("categories.other")}
                      </td>
                      <td className="text-ink-faint px-4 py-3">-</td>
                      <td className="tnum px-4 py-3 text-right font-mono">
                        {fmtMoney(otherCents, "USD")}
                      </td>
                    </tr>
                  )}
                  {topCategories.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-ink-soft px-4 py-8 text-center"
                      >
                        {t("categories.noSpend")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <ul className="mt-3 flex flex-col gap-3 md:hidden">
              {topCategories.map((c) => (
                <li
                  key={`${c.provider}:${c.category}`}
                  className="border-line bg-card flex items-center justify-between gap-3 border p-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.category}</div>
                    <div className="text-ink-soft text-xs">
                      {CONNECTOR_LABELS[c.provider]}
                    </div>
                  </div>
                  <span className="tnum shrink-0 font-mono text-sm">
                    {fmtMoney(c.cents, "USD")}
                  </span>
                </li>
              ))}
              {otherCents > 0 && (
                <li className="border-line bg-card flex items-center justify-between gap-3 border p-4">
                  <span className="text-ink-soft">
                    {t("categories.other")}
                  </span>
                  <span className="tnum shrink-0 font-mono text-sm">
                    {fmtMoney(otherCents, "USD")}
                  </span>
                </li>
              )}
              {topCategories.length === 0 && (
                <li className="border-line bg-card text-ink-soft border px-4 py-8 text-center text-sm">
                  {t("categories.noSpend")}
                </li>
              )}
            </ul>
          </section>
        </>
      )}

      <p className="rise rise-4 text-ink-faint mt-8 mb-8 text-xs">
        {isPreview ? t("footerNote.preview") : t("footerNote.live")}
      </p>
    </div>
  );
}
