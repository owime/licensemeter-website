import type { WasteRuleId } from "~/server/types";

export const RULE_META: Record<
  WasteRuleId,
  { label: string; short: string; badgeClass: string }
> = {
  disabled_account_with_license: {
    label: "Disabled account still licensed",
    short: "Disabled",
    badgeClass: "bg-rust-soft text-rust-deep",
  },
  never_active: {
    label: "Licensed but never active",
    short: "Never active",
    badgeClass: "bg-gold-soft text-gold",
  },
  inactive_90d: {
    label: "Inactive for 90+ days",
    short: "Inactive 90d",
    badgeClass: "bg-gold-soft text-gold",
  },
  shelfware: {
    label: "Unassigned paid seats",
    short: "Shelfware",
    badgeClass: "bg-slate-soft text-slate-ink",
  },
  copilot_unused: {
    label: "Copilot seat unused",
    short: "Copilot idle",
    badgeClass: "bg-plum-soft text-plum",
  },
  licensed_guest: {
    label: "Licensed guest account",
    short: "Guest",
    badgeClass: "bg-teal-soft text-teal-ink",
  },
  adobe_disabled_in_entra: {
    label: "Adobe seat, user disabled in Entra",
    short: "Adobe leak",
    badgeClass: "bg-rust-soft text-rust-deep",
  },
  adobe_orphaned: {
    label: "Adobe seat without Entra account",
    short: "Adobe orphan",
    badgeClass: "bg-plum-soft text-plum",
  },
};

export const ALL_RULES = Object.keys(RULE_META) as WasteRuleId[];

export const isWasteRule = (value: string): value is WasteRuleId =>
  value in RULE_META;
