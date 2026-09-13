import { describe, expect, it } from "vitest";
import { entitlementOf } from "./entitlement";

describe("permanent free access", () => {
  it.each([
    null,
    "active",
    "trialing",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
  ])("keeps full access with historical status %s", (subscriptionStatus) => {
    const tenant = {
      isDemo: false,
      subscriptionStatus,
      trialStartedAt: new Date("2020-01-01"),
      paidUntil: new Date("2020-01-15"),
      mspAccountId: "legacy-account",
    };
    expect(entitlementOf(tenant)).toEqual({
      state: "free",
      active: true,
      locked: false,
    });
  });
  it("keeps the public demo accessible", () => {
    expect(entitlementOf({ isDemo: true })).toEqual({
      state: "demo",
      active: true,
      locked: false,
    });
  });
});
