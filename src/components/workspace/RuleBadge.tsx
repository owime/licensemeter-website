import { RULE_META } from "~/lib/rules";
import type { WasteRuleId } from "~/server/types";

export const RuleBadge = ({ rule }: { rule: WasteRuleId }) => {
  const meta = RULE_META[rule];
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap uppercase ${meta.badgeClass}`}
    >
      {meta.short}
    </span>
  );
};
