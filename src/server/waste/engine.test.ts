import { describe, expect, it } from "vitest";

import type { UserLicense } from "~/server/types";
import {
  analyzeWaste,
  COPILOT_SKU_ID,
  type WasteInput,
  type WasteUser,
} from "./engine";

const NOW = new Date("2026-06-11T00:00:00Z");
const E3 = "05e9a617-0261-4cee-bb44-138d3ef5d965";
const PRICES = { [E3]: 3670, [COPILOT_SKU_ID]: 2810 };

const lic = (skuId: string, assignedByGroup: string | null = null): UserLicense => ({
  skuId,
  assignedByGroup,
  disabledPlans: [],
  state: "Active",
});

const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const user = (overrides: Partial<WasteUser>): WasteUser => ({
  graphId: "u-1",
  upn: "user@example.com",
  displayName: "Test User",
  accountEnabled: true,
  userType: "Member",
  createdDateTime: daysAgo(400),
  lastActivity: daysAgo(2),
  copilotLastActivity: null,
  licenses: [lic(E3)],
  ...overrides,
});

const run = (overrides: Partial<WasteInput>) =>
  analyzeWaste({
    users: [],
    skus: [],
    prices: PRICES,
    now: NOW,
    activitySignal: "full",
    copilotSignal: "per-user",
    ...overrides,
  });

describe("disabled_account_with_license", () => {
  it("flags disabled accounts and sums all license prices", () => {
    const findings = run({
      users: [
        user({
          accountEnabled: false,
          licenses: [lic(E3), lic(COPILOT_SKU_ID)],
        }),
      ],
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("disabled_account_with_license");
    expect(findings[0]!.monthlyImpactCents).toBe(3670 + 2810);
  });

  it("does not double-flag a disabled user via inactivity or copilot rules", () => {
    const findings = run({
      users: [
        user({
          accountEnabled: false,
          lastActivity: daysAgo(200),
          licenses: [lic(COPILOT_SKU_ID)],
        }),
      ],
    });
    expect(findings.map((f) => f.rule)).toEqual([
      "disabled_account_with_license",
    ]);
  });

  it("ignores unlicensed disabled accounts", () => {
    expect(
      run({ users: [user({ accountEnabled: false, licenses: [] })] }),
    ).toHaveLength(0);
  });
});

describe("licensed_guest", () => {
  it("flags enabled guests with licenses", () => {
    const findings = run({ users: [user({ userType: "Guest" })] });
    expect(findings.map((f) => f.rule)).toEqual(["licensed_guest"]);
    expect(findings[0]!.monthlyImpactCents).toBe(3670);
  });

  it("reports a disabled guest only as a disabled account", () => {
    const findings = run({
      users: [user({ userType: "Guest", accountEnabled: false })],
    });
    expect(findings.map((f) => f.rule)).toEqual([
      "disabled_account_with_license",
    ]);
  });
});

describe("never_active", () => {
  it("flags licensed users with no activity after the grace period", () => {
    const findings = run({
      users: [user({ lastActivity: null, createdDateTime: daysAgo(45) })],
    });
    expect(findings.map((f) => f.rule)).toEqual(["never_active"]);
  });

  it("grants new accounts a 30-day grace period", () => {
    expect(
      run({
        users: [user({ lastActivity: null, createdDateTime: daysAgo(10) })],
      }),
    ).toHaveLength(0);
  });

  it("flags users without a creation date who never became active", () => {
    const findings = run({
      users: [user({ lastActivity: null, createdDateTime: null })],
    });
    expect(findings.map((f) => f.rule)).toEqual(["never_active"]);
  });
});

describe("inactive_90d", () => {
  it("flags users inactive for more than 90 days", () => {
    const findings = run({ users: [user({ lastActivity: daysAgo(91) })] });
    expect(findings.map((f) => f.rule)).toEqual(["inactive_90d"]);
    expect(findings[0]!.detail.inactiveDays).toBe(91);
  });

  it("does not flag at exactly 90 days or below", () => {
    expect(run({ users: [user({ lastActivity: daysAgo(90) })] })).toHaveLength(0);
    expect(run({ users: [user({ lastActivity: daysAgo(89) })] })).toHaveLength(0);
  });

  it("skips per-user inactivity rules without an activity signal", () => {
    const findings = run({
      activitySignal: "none",
      users: [
        user({ lastActivity: null, createdDateTime: daysAgo(100) }),
        user({ graphId: "u-2", lastActivity: daysAgo(200) }),
      ],
    });
    expect(findings).toHaveLength(0);
  });

  it("emits an aggregate finding when identities are concealed", () => {
    const findings = run({
      activitySignal: "none",
      usageAggregate: { inactiveCount: 7, totalCount: 100 },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("inactive_90d");
    expect(findings[0]!.graphUserId).toBeNull();
    expect(findings[0]!.monthlyImpactCents).toBe(0);
  });
});

describe("copilot_unused", () => {
  it("flags copilot seats with no usage", () => {
    const findings = run({
      users: [user({ licenses: [lic(E3), lic(COPILOT_SKU_ID)] })],
    });
    expect(findings.map((f) => f.rule)).toEqual(["copilot_unused"]);
    expect(findings[0]!.monthlyImpactCents).toBe(2810);
  });

  it("flags stale copilot usage but not recent usage", () => {
    const stale = run({
      users: [
        user({
          licenses: [lic(COPILOT_SKU_ID)],
          copilotLastActivity: daysAgo(70),
        }),
      ],
    });
    expect(stale.map((f) => f.rule)).toEqual(["copilot_unused"]);

    const recent = run({
      users: [
        user({
          licenses: [lic(COPILOT_SKU_ID)],
          copilotLastActivity: daysAgo(20),
        }),
      ],
    });
    expect(recent).toHaveLength(0);
  });

  it("computes aggregate copilot impact when identities are concealed", () => {
    const findings = run({
      copilotSignal: "aggregate",
      copilotAggregate: { inactiveCount: 5, totalCount: 25 },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]!.monthlyImpactCents).toBe(5 * 2810);
  });
});

describe("shelfware", () => {
  it("prices unassigned seats per SKU", () => {
    const findings = run({
      skus: [
        {
          skuId: E3,
          skuPartNumber: "SPE_E3",
          prepaidEnabled: 100,
          consumedUnits: 90,
        },
      ],
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe("shelfware");
    expect(findings[0]!.monthlyImpactCents).toBe(10 * 3670);
  });

  it("ignores free, viral and capacity-style SKUs", () => {
    const findings = run({
      skus: [
        {
          skuId: "win-store",
          skuPartNumber: "WINDOWS_STORE",
          prepaidEnabled: 1_000_000,
          consumedUnits: 0,
        },
        {
          skuId: "flow-free",
          skuPartNumber: "FLOW_FREE",
          prepaidEnabled: 10_000,
          consumedUnits: 1,
        },
        {
          skuId: "capacity-sku",
          skuPartNumber: "SOME_FUTURE_VIRAL_SKU",
          prepaidEnabled: 50_000,
          consumedUnits: 3,
        },
      ],
    });
    expect(findings).toHaveLength(0);
  });

  it("is silent when every seat is assigned", () => {
    expect(
      run({
        skus: [
          {
            skuId: E3,
            skuPartNumber: "SPE_E3",
            prepaidEnabled: 50,
            consumedUnits: 50,
          },
        ],
      }),
    ).toHaveLength(0);
  });
});
