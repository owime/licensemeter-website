import { PILL_BASE } from "~/components/ui";
import { RULE_META } from "~/lib/rules";
import type { WasteRuleId } from "~/server/types";

export const RuleBadge = ({ rule }: { rule: WasteRuleId }) => {
  const meta = RULE_META[rule];
  return <span className={`${PILL_BASE} ${meta.badgeClass}`}>{meta.short}</span>;
};
