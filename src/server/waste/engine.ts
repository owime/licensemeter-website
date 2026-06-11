import { skuDisplayName } from "~/server/graph/skuCatalog";
import type { AggregateUsage, UserLicense, WasteRuleId } from "~/server/types";

/** Detection thresholds (days). */
export const INACTIVE_DAYS = 90;
export const NEVER_ACTIVE_MIN_AGE_DAYS = 30;
export const COPILOT_INACTIVE_DAYS = 60;

export const COPILOT_SKU_ID = "639dec6b-bb19-468b-871c-c5c441c4b0cb";

export type WasteUser = {
  graphId: string;
  upn: string;
  displayName: string | null;
  accountEnabled: boolean;
  userType: string | null;
  createdDateTime: Date | null;
  /** Best per-user activity signal (sign-ins and/or workload reports); null = never observed. */
  lastActivity: Date | null;
  /** Last Copilot activity when per-user copilot data could be joined. */
  copilotLastActivity: Date | null;
  licenses: UserLicense[];
};

export type WasteSku = {
  skuId: string;
  skuPartNumber: string;
  prepaidEnabled: number;
  consumedUnits: number;
};

export type WasteInput = {
  users: WasteUser[];
  skus: WasteSku[];
  /** skuId -> monthly price in cents. */
  prices: Record<string, number>;
  now: Date;
  /**
   * "full": per-user activity is reliable (Entra P1 sign-ins and/or joinable usage reports).
   * "none": no per-user activity signal (no P1 and concealed reports) — per-user
   * inactivity rules are skipped and an aggregate finding is emitted instead.
   */
  activitySignal: "full" | "none";
  copilotSignal: "per-user" | "aggregate" | "none";
  usageAggregate?: AggregateUsage;
  copilotAggregate?: AggregateUsage;
};

export type WasteFinding = {
  dedupeKey: string;
  rule: WasteRuleId;
  graphUserId: string | null;
  skuId: string | null;
  title: string;
  detail: Record<string, unknown>;
  monthlyImpactCents: number;
};

const key = (rule: WasteRuleId, userId?: string | null, skuId?: string | null) =>
  `${rule}|${userId ?? "-"}|${skuId ?? "-"}`;

/**
 * Free, viral and capacity-style SKUs whose "unassigned seats" carry no cost:
 * every real tenant has e.g. WINDOWS_STORE with a million prepaid units.
 * Observed on the first live tenant sync; without this every customer sees
 * meaningless shelfware findings on day one.
 */
const SHELFWARE_EXEMPT_PART_NUMBERS = new Set([
  "WINDOWS_STORE",
  "FLOW_FREE",
  "POWERAPPS_VIRAL",
  "POWER_VIRTUAL_AGENTS_VIRAL",
  "TEAMS_EXPLORATORY",
  "TEAMS_COMMERCIAL_TRIAL",
  "POWER_BI_STANDARD",
  "CCIBOTS_PRIVPREV_VIRAL",
  "RIGHTSMANAGEMENT_ADHOC",
  "POWERAPPS_DEV",
]);

/** Capacity-style allotments (10k+ "seats") are licensing plumbing, not purchases. */
const SHELFWARE_CAPACITY_THRESHOLD = 5000;

const isShelfwareExempt = (sku: WasteSku): boolean =>
  SHELFWARE_EXEMPT_PART_NUMBERS.has(sku.skuPartNumber) ||
  sku.prepaidEnabled >= SHELFWARE_CAPACITY_THRESHOLD;

const daysBetween = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));

const licenseCost = (licenses: UserLicense[], prices: Record<string, number>) =>
  licenses.reduce((sum, l) => sum + (prices[l.skuId] ?? 0), 0);

const licenseDetail = (licenses: UserLicense[], prices: Record<string, number>) =>
  licenses.map((l) => ({
    skuId: l.skuId,
    name: skuDisplayName(l.skuId),
    monthlyPriceCents: prices[l.skuId] ?? 0,
    assignedByGroup: l.assignedByGroup,
  }));

const userDetail = (u: WasteUser, prices: Record<string, number>) => ({
  upn: u.upn,
  displayName: u.displayName,
  lastActivity: u.lastActivity?.toISOString() ?? null,
  licenses: licenseDetail(u.licenses, prices),
});

/** Pure rule evaluation over a tenant snapshot. Persistence and diffing live in the sync layer. */
export const analyzeWaste = (input: WasteInput): WasteFinding[] => {
  const { users, skus, prices, now } = input;
  const findings: WasteFinding[] = [];

  for (const u of users) {
    if (u.licenses.length === 0) continue;

    // Rule 1: disabled account still holding licenses (offboarding leak).
    if (!u.accountEnabled) {
      findings.push({
        dedupeKey: key("disabled_account_with_license", u.graphId),
        rule: "disabled_account_with_license",
        graphUserId: u.graphId,
        skuId: null,
        title: `Disabled account still licensed: ${u.displayName ?? u.upn}`,
        detail: userDetail(u, prices),
        monthlyImpactCents: licenseCost(u.licenses, prices),
      });
      continue; // avoid double-flagging the same seat via inactivity rules
    }

    // Rule 6: licensed guest account.
    if (u.userType === "Guest") {
      findings.push({
        dedupeKey: key("licensed_guest", u.graphId),
        rule: "licensed_guest",
        graphUserId: u.graphId,
        skuId: null,
        title: `Licensed guest account: ${u.displayName ?? u.upn}`,
        detail: userDetail(u, prices),
        monthlyImpactCents: licenseCost(u.licenses, prices),
      });
      continue;
    }

    if (input.activitySignal === "full") {
      // Rule 2: licensed but never active (grace period after account creation).
      const ageDays = u.createdDateTime
        ? daysBetween(u.createdDateTime, now)
        : Infinity;
      if (u.lastActivity === null && ageDays >= NEVER_ACTIVE_MIN_AGE_DAYS) {
        findings.push({
          dedupeKey: key("never_active", u.graphId),
          rule: "never_active",
          graphUserId: u.graphId,
          skuId: null,
          title: `Licensed but never active: ${u.displayName ?? u.upn}`,
          detail: { ...userDetail(u, prices), accountAgeDays: ageDays },
          monthlyImpactCents: licenseCost(u.licenses, prices),
        });
        continue;
      }

      // Rule 3: no activity for INACTIVE_DAYS.
      if (u.lastActivity !== null) {
        const inactiveDays = daysBetween(u.lastActivity, now);
        if (inactiveDays > INACTIVE_DAYS) {
          findings.push({
            dedupeKey: key("inactive_90d", u.graphId),
            rule: "inactive_90d",
            graphUserId: u.graphId,
            skuId: null,
            title: `No activity for ${inactiveDays} days: ${u.displayName ?? u.upn}`,
            detail: { ...userDetail(u, prices), inactiveDays },
            monthlyImpactCents: licenseCost(u.licenses, prices),
          });
          continue;
        }
      }
    }

    // Rule 5: Copilot seat without Copilot usage (per-user signal available).
    if (
      input.copilotSignal === "per-user" &&
      u.licenses.some((l) => l.skuId === COPILOT_SKU_ID)
    ) {
      const idle =
        u.copilotLastActivity === null ||
        daysBetween(u.copilotLastActivity, now) > COPILOT_INACTIVE_DAYS;
      if (idle) {
        findings.push({
          dedupeKey: key("copilot_unused", u.graphId, COPILOT_SKU_ID),
          rule: "copilot_unused",
          graphUserId: u.graphId,
          skuId: COPILOT_SKU_ID,
          title: `Copilot seat unused: ${u.displayName ?? u.upn}`,
          detail: {
            upn: u.upn,
            displayName: u.displayName,
            copilotLastActivity: u.copilotLastActivity?.toISOString() ?? null,
          },
          monthlyImpactCents: prices[COPILOT_SKU_ID] ?? 0,
        });
      }
    }
  }

  // Rule 4: shelfware — paid seats nobody is assigned to.
  for (const sku of skus) {
    if (isShelfwareExempt(sku)) continue;
    const unassigned = sku.prepaidEnabled - sku.consumedUnits;
    if (unassigned > 0) {
      findings.push({
        dedupeKey: key("shelfware", null, sku.skuId),
        rule: "shelfware",
        graphUserId: null,
        skuId: sku.skuId,
        title: `Unassigned paid seats: ${skuDisplayName(sku.skuId, sku.skuPartNumber)} (${unassigned})`,
        detail: {
          skuId: sku.skuId,
          skuPartNumber: sku.skuPartNumber,
          purchased: sku.prepaidEnabled,
          assigned: sku.consumedUnits,
          unassigned,
        },
        monthlyImpactCents: unassigned * (prices[sku.skuId] ?? 0),
      });
    }
  }

  // Aggregate fallbacks when identities are concealed / no per-user signal exists.
  if (input.copilotSignal === "aggregate" && input.copilotAggregate) {
    const { inactiveCount, totalCount } = input.copilotAggregate;
    if (inactiveCount > 0) {
      findings.push({
        dedupeKey: key("copilot_unused", "aggregate", COPILOT_SKU_ID),
        rule: "copilot_unused",
        graphUserId: null,
        skuId: COPILOT_SKU_ID,
        title: `${inactiveCount} of ${totalCount} Copilot seats show no usage`,
        detail: { aggregate: true, inactiveCount, totalCount },
        monthlyImpactCents: inactiveCount * (prices[COPILOT_SKU_ID] ?? 0),
      });
    }
  }

  if (input.activitySignal === "none" && input.usageAggregate) {
    const { inactiveCount, totalCount } = input.usageAggregate;
    if (inactiveCount > 0) {
      findings.push({
        dedupeKey: key("inactive_90d", "aggregate", null),
        rule: "inactive_90d",
        graphUserId: null,
        skuId: null,
        title: `${inactiveCount} of ${totalCount} users show no activity in 90 days (identities concealed)`,
        detail: {
          aggregate: true,
          inactiveCount,
          totalCount,
          hint: "Enable identifiable report names in Microsoft 365 admin center (Org settings > Reports) or assign Entra ID P1 to get per-user findings.",
        },
        monthlyImpactCents: 0,
      });
    }
  }

  return findings;
};
