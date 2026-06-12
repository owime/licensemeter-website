import { PILL_BASE } from "~/components/ui";
import { findingChipLabel, RULE_META } from "~/lib/rules";
import type { WasteRuleId } from "~/server/types";

/**
 * Rule pill for concrete finding rows: the generic SaaS rules pick up the
 * provider name from the finding detail ("Zoom leak" instead of "App leak").
 * Filter pills keep using RULE_META's rule-generic short text.
 */
export const FindingChip = ({
  rule,
  detail,
}: {
  rule: WasteRuleId;
  detail: Record<string, unknown>;
}) => (
  <span className={`${PILL_BASE} ${RULE_META[rule].badgeClass}`}>
    {findingChipLabel(rule, detail)}
  </span>
);
