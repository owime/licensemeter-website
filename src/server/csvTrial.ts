/**
 * Pure parsing/mapping for the zero-consent CSV trial: turns the two
 * Microsoft 365 admin center exports a Reports Reader can produce into the
 * same shapes the Graph sync stores, without touching env or the database.
 *
 * Directory file: Users > Active users > "Export users" (users.csv).
 * Usage file:     Reports > Usage > Active users > Export (detail), the
 *                 same report family as Graph getOffice365ActiveUserDetail.
 *
 * Header matching is alias-based (English and German, case-insensitive)
 * because Microsoft reworked the export format around the MSOnline
 * retirement (Dec 2024 / Jan 2025) and localizes admin-center columns.
 */

import { parseCsv } from "~/server/graph/reportCsv";
import { SKU_CATALOG } from "~/server/graph/skuCatalog";
import type { UserLicense, WorkloadActivity } from "~/server/types";

export type CsvHeaderError = {
  ok: false;
  /** Human-readable summary the UI can show directly. */
  error: string;
  /** Header names (any alias) that would have satisfied the missing fields. */
  expectedHeaders: string[];
  /** Headers actually present in the uploaded file. */
  foundHeaders: string[];
};

export type DirectoryRow = {
  upn: string;
  displayName: string | null;
  /** "Block credential" True (or a blocked sign-in status) => false. */
  accountEnabled: boolean;
  /** Raw license display names exactly as exported, split per license. */
  licenseNames: string[];
};

export type UsageRow = {
  upn: string;
  /** Max across all activity columns present; null = no activity recorded. */
  lastActivity: Date | null;
  /** ISO dates per workload, mirroring the Graph usage report mapping. */
  workloadActivity: WorkloadActivity;
};

export type CsvSku = {
  skuId: string;
  partNumber: string;
  displayName: string;
  /** True when the name matched nothing in the SKU catalog. */
  isSynthetic: boolean;
};

const ok = <T>(rows: T[]): { ok: true; rows: T[] } => ({ ok: true, rows });

/** Normalize a header cell for alias matching: BOM/trim/case/inner spaces. */
const normalizeHeader = (h: string): string =>
  h.replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * English aliases cover both the classic MSOnline-era export and the
 * reworked 2025 one; German aliases follow the de-de admin center labels.
 */
const DIRECTORY_ALIASES = {
  upn: [
    "user principal name",
    "userprincipalname",
    "username",
    "user name",
    "benutzerprinzipalname",
    "benutzername",
  ],
  displayName: ["display name", "displayname", "anzeigename"],
  licenses: ["licenses", "lizenzen"],
  block: [
    "block credential",
    "blockcredential",
    "anmeldeinformationen blockieren",
    "anmeldung blockiert",
    "anmeldung blockieren",
    "sign-in status",
    "signin status",
    "sign in status",
    "anmeldestatus",
  ],
} as const;

/** Cell values meaning "sign-in blocked" across both column families. */
const BLOCKED_VALUES = new Set([
  "true",
  "wahr",
  "ja",
  "yes",
  "blocked",
  "blockiert",
  "blocked from signing in",
]);

const findColumn = (header: string[], aliases: readonly string[]): number => {
  const normalized = header.map(normalizeHeader);
  for (const alias of aliases) {
    const i = normalized.indexOf(alias);
    if (i !== -1) return i;
  }
  return -1;
};

const headerError = (
  fileLabel: string,
  missing: { field: string; aliases: readonly string[] }[],
  header: string[],
): CsvHeaderError => {
  const found = header.map((h) => normalizeHeader(h)).filter((h) => h !== "");
  const expected = missing.map((m) => `"${m.aliases[0]}"`).join(", ");
  const semicolonHint =
    header.length === 1 && (header[0]?.includes(";") ?? false)
      ? " The file looks semicolon-separated. Upload the original comma-separated export from the admin center."
      : "";
  return {
    ok: false,
    error:
      `This does not look like the ${fileLabel}: missing the ${expected} ` +
      `column${missing.length === 1 ? "" : "s"}. Found columns: ` +
      `${found.length > 0 ? found.join(", ") : "none"}.${semicolonHint}`,
    expectedHeaders: missing.flatMap((m) => [...m.aliases]),
    foundHeaders: found,
  };
};

/**
 * Parses the admin center "Export users" CSV. Required columns: UPN and
 * Licenses; Display name and Block credential degrade gracefully because
 * Microsoft has added/removed export columns repeatedly.
 */
export const parseDirectoryExport = (
  text: string,
): { ok: true; rows: DirectoryRow[] } | CsvHeaderError => {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];

  const upnCol = findColumn(header, DIRECTORY_ALIASES.upn);
  const licensesCol = findColumn(header, DIRECTORY_ALIASES.licenses);
  const displayCol = findColumn(header, DIRECTORY_ALIASES.displayName);
  const blockCol = findColumn(header, DIRECTORY_ALIASES.block);

  const missing: { field: string; aliases: readonly string[] }[] = [];
  if (upnCol === -1)
    missing.push({ field: "upn", aliases: DIRECTORY_ALIASES.upn });
  if (licensesCol === -1)
    missing.push({ field: "licenses", aliases: DIRECTORY_ALIASES.licenses });
  if (missing.length > 0) {
    return headerError(
      "user export (Users > Active users > Export users)",
      missing,
      header,
    );
  }

  const out: DirectoryRow[] = [];
  for (const cells of rows.slice(1)) {
    const upn = (cells[upnCol] ?? "").trim();
    if (upn === "") continue;
    const displayName =
      displayCol === -1 ? null : (cells[displayCol] ?? "").trim() || null;
    const blockRaw =
      blockCol === -1 ? "" : (cells[blockCol] ?? "").trim().toLowerCase();
    // The Licenses cell joins multiple license names with "+" (restored in
    // the Jan 2025 export rework); tolerate ";" from re-saved files.
    const licenseNames = (cells[licensesCol] ?? "")
      .split(/[+;]/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    out.push({
      upn,
      displayName,
      accountEnabled: !BLOCKED_VALUES.has(blockRaw),
      licenseNames,
    });
  }
  return ok(out);
};

/**
 * Usage report columns: the Graph CSV names (used by the admin center
 * export, see getOffice365ActiveUserDetail) plus the friendlier labels the
 * report UI shows, in case Microsoft aligns the export with them.
 */
const USAGE_ALIASES = {
  upn: [
    "user principal name",
    "userprincipalname",
    "username",
    "user name",
    "benutzerprinzipalname",
  ],
  exchange: ["exchange last activity date", "last active date for exchange"],
  oneDrive: ["onedrive last activity date", "last active date for onedrive"],
  sharePoint: [
    "sharepoint last activity date",
    "last active date for sharepoint",
  ],
  teams: [
    "teams last activity date",
    "last active date for microsoft teams",
    "last active date for teams",
  ],
  lastActivity: [
    "last activity date",
    "last activity date (utc)",
    "last active date",
  ],
} as const;

const toDate = (value: string | undefined): Date | null => {
  const v = value?.trim();
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const isoOrNull = (value: string | undefined): string | null => {
  const v = value?.trim();
  if (!v) return null;
  return v;
};

const maxDate = (...dates: (Date | null)[]): Date | null =>
  dates.reduce<Date | null>(
    (max, d) => (d && (!max || d > max) ? d : max),
    null,
  );

/**
 * Parses the Reports > Usage > Active users detail export. Requires a UPN
 * column plus at least one activity-date column (per-workload or overall).
 */
export const parseUsageExport = (
  text: string,
): { ok: true; rows: UsageRow[] } | CsvHeaderError => {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];

  const upnCol = findColumn(header, USAGE_ALIASES.upn);
  const exchangeCol = findColumn(header, USAGE_ALIASES.exchange);
  const oneDriveCol = findColumn(header, USAGE_ALIASES.oneDrive);
  const sharePointCol = findColumn(header, USAGE_ALIASES.sharePoint);
  const teamsCol = findColumn(header, USAGE_ALIASES.teams);
  const lastActivityCol = findColumn(header, USAGE_ALIASES.lastActivity);

  const hasActivityColumn =
    exchangeCol !== -1 ||
    oneDriveCol !== -1 ||
    sharePointCol !== -1 ||
    teamsCol !== -1 ||
    lastActivityCol !== -1;

  const missing: { field: string; aliases: readonly string[] }[] = [];
  if (upnCol === -1) missing.push({ field: "upn", aliases: USAGE_ALIASES.upn });
  if (!hasActivityColumn) {
    missing.push({
      field: "lastActivity",
      aliases: [...USAGE_ALIASES.exchange, ...USAGE_ALIASES.lastActivity],
    });
  }
  if (missing.length > 0) {
    return headerError(
      "usage export (Reports > Usage > Active users > Export)",
      missing,
      header,
    );
  }

  const cell = (cells: string[], col: number): string | undefined =>
    col === -1 ? undefined : cells[col];

  const out: UsageRow[] = [];
  for (const cells of rows.slice(1)) {
    const upn = (cells[upnCol] ?? "").trim();
    if (upn === "") continue;
    const workloadActivity: WorkloadActivity = {
      exchange: isoOrNull(cell(cells, exchangeCol)),
      oneDrive: isoOrNull(cell(cells, oneDriveCol)),
      sharePoint: isoOrNull(cell(cells, sharePointCol)),
      teams: isoOrNull(cell(cells, teamsCol)),
      copilot: null,
    };
    const lastActivity = maxDate(
      toDate(cell(cells, lastActivityCol)),
      toDate(workloadActivity.exchange ?? undefined),
      toDate(workloadActivity.oneDrive ?? undefined),
      toDate(workloadActivity.sharePoint ?? undefined),
      toDate(workloadActivity.teams ?? undefined),
    );
    out.push({ upn, lastActivity, workloadActivity });
  }
  return ok(out);
};

/**
 * True when the usage report is unusable for the per-user join: identities
 * are concealed (opaque hashes instead of UPNs, the tenant's "display
 * concealed names" report setting) or almost nothing joins to the directory.
 */
export const detectConcealment = (
  directoryRows: DirectoryRow[],
  usageRows: UsageRow[],
): boolean => {
  if (usageRows.length === 0) return false;
  // Concealed report rows carry an MD5 hash instead of a UPN (no "@").
  if (usageRows.some((r) => !r.upn.includes("@"))) return true;
  if (directoryRows.length === 0) return false;
  const directoryUpns = new Set(directoryRows.map((r) => r.upn.toLowerCase()));
  const joined = usageRows.filter((r) =>
    directoryUpns.has(r.upn.toLowerCase()),
  ).length;
  return joined / usageRows.length < 0.1;
};

/** Lazily built lookups over the static catalog: name/part number -> skuId. */
let catalogByName: Map<string, string> | null = null;
const catalogLookup = (): Map<string, string> => {
  if (!catalogByName) {
    catalogByName = new Map();
    for (const [skuId, entry] of Object.entries(SKU_CATALOG)) {
      catalogByName.set(entry.name.toLowerCase(), skuId);
      catalogByName.set(entry.partNumber.toLowerCase(), skuId);
    }
  }
  return catalogByName;
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Resolves exported license names against the SKU catalog (display name or
 * part number, case-insensitive). Unmatched names become synthetic
 * "csv:<slug>" SKUs that keep the original name for display and price at 0
 * until the customer fills the price book.
 */
export const mapLicenses = (
  licenseNames: string[],
): { licenses: UserLicense[]; skus: CsvSku[] } => {
  const lookup = catalogLookup();
  const licenses: UserLicense[] = [];
  const skus: CsvSku[] = [];
  const seen = new Set<string>();

  for (const raw of licenseNames) {
    const name = raw.trim();
    if (name === "") continue;
    const matched = lookup.get(name.toLowerCase());
    const skuId = matched ?? `csv:${slugify(name)}`;
    if (seen.has(skuId)) continue; // a user cannot hold the same SKU twice
    seen.add(skuId);
    licenses.push({
      skuId,
      assignedByGroup: null,
      disabledPlans: [],
      state: "Active",
    });
    const entry = matched ? SKU_CATALOG[matched] : undefined;
    skus.push({
      skuId,
      partNumber: entry?.partNumber ?? name,
      displayName: entry?.name ?? name,
      isSynthetic: !matched,
    });
  }
  return { licenses, skus };
};
