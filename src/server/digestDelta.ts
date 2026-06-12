import type { FindingStatus } from "~/server/types";

/**
 * Pure helpers behind the weekly digest's "what changed" framing: the 7-day
 * finding delta and the renewal-window date math. No DB, no IO — unit tested.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The digest's look-back window. */
export const DELTA_WINDOW_MS = 7 * DAY_MS;

export type DeltaFindingRow = {
  status: FindingStatus;
  firstSeenAt: Date;
  resolvedAt: Date | null;
  monthlyImpactCents: number;
};

export type DigestDelta = {
  /** Findings that first appeared within the window and are still open/acknowledged. */
  newCount: number;
  newCents: number;
  /** Findings resolved within the window. */
  resolvedCount: number;
  resolvedCents: number;
};

const withinWindow = (t: Date, now: Date): boolean =>
  now.getTime() - t.getTime() <= DELTA_WINDOW_MS;

/**
 * 7-day delta over finding rows (boundary inclusive: exactly 7 days old still
 * counts). A finding that appeared and was resolved within the same window
 * counts as resolved, not as new — the status filters keep the two branches
 * disjoint per row. The resolved branch also requires status "resolved":
 * a manually reopened finding can carry a stale resolvedAt (the UI status
 * actions do not clear it) and has not actually freed any money.
 */
export const computeDigestDelta = (
  rows: DeltaFindingRow[],
  now: Date,
): DigestDelta => {
  const delta: DigestDelta = {
    newCount: 0,
    newCents: 0,
    resolvedCount: 0,
    resolvedCents: 0,
  };
  for (const row of rows) {
    if (
      (row.status === "open" || row.status === "acknowledged") &&
      withinWindow(row.firstSeenAt, now)
    ) {
      delta.newCount++;
      delta.newCents += row.monthlyImpactCents;
    } else if (
      row.status === "resolved" &&
      row.resolvedAt &&
      withinWindow(row.resolvedAt, now)
    ) {
      delta.resolvedCount++;
      delta.resolvedCents += row.monthlyImpactCents;
    }
  }
  return delta;
};

/**
 * Whole days from `now`'s UTC date to a yyyy-mm-dd date-column string,
 * negative when the date is past, null when unset or malformed. Both sides
 * are pinned to UTC midnight — `new Date("yyyy-mm-dd")` math drifts a day
 * on servers west of UTC.
 */
export const daysUntilDate = (
  dateStr: string | null,
  now: Date,
): number | null => {
  if (!dateStr) return null;
  const target = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((target - today) / DAY_MS);
};

/**
 * Whole days until the tenant's renewal date. Returns null when unset,
 * malformed, already past, or further out than `windowDays` (boundary
 * inclusive: exactly `windowDays` away still returns a number).
 */
export const daysUntilRenewal = (
  renewalDate: string | null,
  now: Date,
  windowDays = 90,
): number | null => {
  const days = daysUntilDate(renewalDate, now);
  if (days === null || days < 0 || days > windowDays) return null;
  return days;
};

/** "Renewal today" / "Renewal in 1 day" / "Renewal in N days". */
export const renewalPhrase = (days: number): string =>
  days === 0
    ? "Renewal today"
    : days === 1
      ? "Renewal in 1 day"
      : `Renewal in ${days} days`;
