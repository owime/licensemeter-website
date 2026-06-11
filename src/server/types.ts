/** Shared domain types stored in jsonb columns and passed through the sync pipeline. */

export type MembershipRole = "owner" | "admin" | "viewer";

export type FindingStatus = "open" | "acknowledged" | "resolved";

export type SyncRunStatus = "running" | "success" | "partial" | "failed";

export type UserLicense = {
  skuId: string;
  /** Group object id when the license is inherited via group-based licensing, null when direct. */
  assignedByGroup: string | null;
  disabledPlans: string[];
  state: string;
};

/** ISO date (yyyy-mm-dd) of the last activity per workload, null when never active. */
export type WorkloadActivity = {
  exchange: string | null;
  oneDrive: string | null;
  sharePoint: string | null;
  teams: string | null;
  copilot: string | null;
};

export type SyncStep = {
  step:
    | "subscribedSkus"
    | "reportSettings"
    | "users"
    | "signInActivity"
    | "usageReports"
    | "copilotUsage"
    | "wasteAnalysis";
  status: "ok" | "warning" | "failed" | "skipped";
  message?: string;
  count?: number;
};

export type WasteRuleId =
  | "disabled_account_with_license"
  | "never_active"
  | "inactive_90d"
  | "shelfware"
  | "copilot_unused"
  | "licensed_guest";

/** Aggregate counts captured when user identities are concealed in usage reports. */
export type AggregateUsage = {
  /** Rows in the usage report with no activity in the period. */
  inactiveCount: number;
  totalCount: number;
};
