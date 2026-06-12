import { describe, expect, it } from "vitest";

import { LEAK_RULES, pickLeakFindings } from "~/server/leakAlerts";
import type { WasteRuleId } from "~/server/types";

const finding = (rule: WasteRuleId) => ({
  id: `id-${rule}`,
  rule,
  title: `t-${rule}`,
  monthlyImpactCents: 100,
});

describe("pickLeakFindings", () => {
  it("returns empty for no inserted findings", () => {
    expect(pickLeakFindings([])).toEqual([]);
  });

  it("keeps exactly the offboarding-leak rule class", () => {
    const leaks: WasteRuleId[] = [
      "disabled_account_with_license",
      "adobe_disabled_in_entra",
      "adobe_orphaned",
      "saas_disabled_in_entra",
      "saas_orphaned",
    ];
    const nonLeaks: WasteRuleId[] = [
      "never_active",
      "inactive_90d",
      "shelfware",
      "copilot_unused",
      "licensed_guest",
      "saas_inactive",
      "overlapping_licenses",
      "service_plans_disabled",
    ];
    const picked = pickLeakFindings(
      [...leaks, ...nonLeaks].map((rule) => finding(rule)),
    );
    expect(picked.map((f) => f.rule).sort()).toEqual([...leaks].sort());
    expect([...LEAK_RULES].sort()).toEqual([...leaks].sort());
  });

  it("preserves the full row shape of what it keeps", () => {
    const leak = finding("saas_orphaned");
    expect(pickLeakFindings([leak, finding("shelfware")])).toEqual([leak]);
  });
});
