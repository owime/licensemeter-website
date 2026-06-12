import type { WasteRuleId } from "~/server/types";

/**
 * Offboarding leaks: someone left or was disabled, the seat keeps billing.
 * These recur forever until acted on, so they alert immediately on sync
 * instead of waiting up to a week for the digest. Pure helper, no IO.
 */
export const LEAK_RULES: ReadonlySet<WasteRuleId> = new Set<WasteRuleId>([
  "disabled_account_with_license",
  "adobe_disabled_in_entra",
  "adobe_orphaned",
  "saas_disabled_in_entra",
  "saas_orphaned",
]);

/** Newly inserted findings that belong to the offboarding-leak rule class. */
export const pickLeakFindings = <T extends { rule: WasteRuleId }>(
  inserted: T[],
): T[] => inserted.filter((f) => LEAK_RULES.has(f.rule));
