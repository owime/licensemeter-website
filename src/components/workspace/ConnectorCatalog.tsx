"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  FileUp,
  Plug,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ConnectorLogo } from "~/components/ConnectorLogo";
import {
  WORKSPACE_CONNECTORS,
  type ConnectorStatus,
  type ConnectorSummary,
} from "~/lib/workspaceConnectors";

const STATUS_KEYS: Record<ConnectorStatus, string> = {
  available: "statusNotConnected",
  connected: "statusConnected",
  imported: "statusImported",
  attention: "statusAttention",
  demo: "statusDemo",
};
const STATUS_CLASS: Record<ConnectorStatus, string> = {
  available: "bg-subtle text-ink-soft",
  connected: "bg-good-soft text-good-text",
  imported: "bg-good-soft text-good-text",
  attention: "bg-gold-soft text-gold-text",
  demo: "bg-subtle text-ink-soft",
};
/* Category values must match connector.category from workspaceConnectors
   (untranslated data), so the array stays in English for the filter logic;
   FILTER_KEYS maps each value to its translated display label. */
const FILTERS = ["All connectors", "Licenses", "AI & usage"] as const;
const FILTER_KEYS: Record<(typeof FILTERS)[number], string> = {
  "All connectors": "filterAll",
  Licenses: "filterLicenses",
  "AI & usage": "filterAiUsage",
};

export function ConnectorCatalog({
  summaries,
  isDemo,
  canManage,
  microsoftConnected,
}: {
  summaries: ConnectorSummary[];
  isDemo: boolean;
  canManage: boolean;
  microsoftConnected: boolean;
}) {
  const t = useTranslations("connectorsDash.catalog");
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]>("All connectors");
  const active = summaries.filter((item) =>
    ["connected", "imported", "attention"].includes(item.status),
  ).length;
  const connectors = WORKSPACE_CONNECTORS.filter(
    (item) =>
      (filter === "All connectors" || item.category === filter) &&
      `${item.name} ${item.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl pb-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-brand-text text-[11px] font-semibold tracking-[0.16em] uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-ink-soft mt-3 max-w-xl text-base leading-7">
            {t("subtitleLine1")}
            <br className="hidden sm:block" /> {t("subtitleLine2")}
          </p>
        </div>
        <div className="border-line flex gap-7 rounded-2xl border bg-white px-6 py-4">
          <div>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {String(WORKSPACE_CONNECTORS.length).padStart(2, "0")}
            </p>
            <p className="text-ink-faint mt-1 text-xs">
              {t("availableConnectors")}
            </p>
          </div>
          <div className="border-line border-l pl-7">
            <p className="font-display text-brand-text text-2xl font-semibold tabular-nums">
              {isDemo ? t("demoLabel") : String(active).padStart(2, "0")}
            </p>
            <p className="text-ink-faint mt-1 text-xs">
              {isDemo ? t("sampleWorkspace") : t("addedToWorkspace")}
            </p>
          </div>
        </div>
      </header>

      <div className="border-brand/15 bg-brand-soft/60 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="text-brand-text mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-ink text-sm font-medium">
              {isDemo
                ? t("bannerTitleDemo")
                : !microsoftConnected
                  ? t("bannerTitleStartMicrosoft")
                  : t("bannerTitleConnected")}
            </p>
            <p className="text-ink-soft mt-1 max-w-2xl text-xs leading-5">
              {isDemo
                ? t("bannerBodyDemo")
                : !microsoftConnected
                  ? t("bannerBodyStartMicrosoft")
                  : t("bannerBodyConnected")}
            </p>
          </div>
        </div>
        {!isDemo && !microsoftConnected && (
          <Link
            href="/app/connectors/microsoft"
            className="text-brand-text inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
          >
            {t("viewMicrosoft")}{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
        <div
          className="bg-subtle flex max-w-full flex-wrap gap-1 rounded-xl p-1"
          aria-label={t("filterAriaLabel")}
        >
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-lg px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${filter === value ? "text-ink bg-white shadow-sm" : "text-ink-soft hover:text-ink"}`}
            >
              {t(FILTER_KEYS[value])}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="text-ink-faint pointer-events-none absolute top-3 left-3 size-4"
            aria-hidden="true"
          />
          <input
            type="search"
            name="connector-search"
            autoComplete="off"
            aria-label={t("searchAriaLabel")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border-line text-ink placeholder:text-ink-faint h-10 w-full rounded-xl border bg-white pr-3 pl-9 text-sm"
          />
        </div>
      </div>
      <p className="text-ink-faint mt-5 text-xs" role="status">
        {filter !== "All connectors"
          ? t("countInFilter", {
              count: connectors.length,
              filter: t(FILTER_KEYS[filter]).toLowerCase(),
            })
          : t("countAvailable", { count: connectors.length })}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connectors.map((connector) => {
          const summary = summaries.find((item) => item.id === connector.id)!;
          const statusClass = STATUS_CLASS[summary.status];
          const statusLabel = t(STATUS_KEYS[summary.status]);
          const action = isDemo
            ? t("actionExplore")
            : !canManage
              ? t("actionView")
              : summary.status === "attention"
                ? t("actionReview")
                : summary.status === "connected" ||
                    summary.status === "imported"
                  ? t("actionManage")
                  : connector.method === "CSV import"
                    ? t("actionImport")
                    : t("actionSetup");
          return (
            <Link
              key={connector.id}
              href={`/app/connectors/${connector.id}`}
              aria-label={t("cardAriaLabel", {
                action,
                name: connector.name,
              })}
              aria-describedby={`connector-${connector.id}-status connector-${connector.id}-description`}
              className="connector-tile group border-line hover:border-brand/35 flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white p-6 transition-[border-color,box-shadow] hover:shadow-lg"
              style={
                { "--connector-accent": connector.accent } as CSSProperties
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="connector-tile-logo flex size-14 shrink-0 items-center justify-center rounded-2xl">
                  <ConnectorLogo brand={connector.id} size={32} />
                </span>
                <span
                  id={`connector-${connector.id}-status`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}
                >
                  {(summary.status === "connected" ||
                    summary.status === "imported") && (
                    <Check className="size-3" aria-hidden="true" />
                  )}
                  {statusLabel}
                </span>
              </div>
              <h2 className="font-display mt-5 text-xl font-semibold tracking-tight">
                {connector.name}
              </h2>
              <p
                id={`connector-${connector.id}-description`}
                className="text-ink-soft mt-2 min-h-16 text-[13px] leading-6"
              >
                {connector.description}
              </p>
              <p className="text-ink-faint mt-4 flex items-center gap-1.5 text-[11px]">
                {connector.method === "CSV import" ? (
                  <FileUp className="size-3.5" aria-hidden="true" />
                ) : (
                  <Plug className="size-3.5" aria-hidden="true" />
                )}
                {connector.method}
                <span className="mx-1" aria-hidden="true">
                  ·
                </span>
                {connector.category}
              </p>
              <div className="border-line mt-5 flex items-center justify-between gap-2 border-t pt-4">
                <div className="min-w-0">
                  <p className="text-brand-text text-xs font-semibold">
                    {action}
                  </p>
                  <p className="text-ink-faint mt-1 text-[10px] leading-4">
                    {summary.detail}
                  </p>
                </div>
                <span className="bg-subtle group-hover:bg-brand-soft text-brand-text flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
                  <ArrowRight
                    className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {connectors.length === 0 && (
        <div className="border-line mt-4 rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
          <Search
            className="text-ink-faint mx-auto size-6"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-medium">{t("noResultsTitle")}</h2>
          <p className="text-ink-soft mt-2 text-sm">{t("noResultsBody")}</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("All connectors");
            }}
            className="text-brand-text mt-4 min-h-11 text-sm font-semibold underline underline-offset-4"
          >
            {t("showAll")}
          </button>
        </div>
      )}
      <p className="text-ink-faint mt-8 text-center text-xs leading-6">
        {t("missingTool")}{" "}
        <Link
          href="/support"
          className="text-brand-text font-medium underline underline-offset-4"
        >
          {t("suggestConnector")}
        </Link>
      </p>
    </div>
  );
}
