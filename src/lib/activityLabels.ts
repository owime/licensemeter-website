import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

const words = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const SYNC_STEP_KEYS = new Set([
  "subscribedSkus",
  "reportSettings",
  "signInActivity",
  "users",
  "usageReports",
  "copilotUsage",
  "adobeUsers",
  "wasteAnalysis",
]);

const ACTION_KEYS = new Set([
  "finding_status_changed",
  "finding_workflow_updated",
  "findings_bulk_updated",
  "sync_triggered",
  "price_updated",
  "prices_imported",
  "seats_imported",
  "seats_import_cleared",
  "microsoft_connected",
  "microsoft_disconnected",
  "connector_connected",
  "connector_disconnected",
  "adobe_connected",
  "adobe_disconnected",
  "member_added",
  "member_removed",
  "member_role_changed",
  "invite_resent",
  "threshold_changed",
  "currency_changed",
  "renewal_created",
  "renewal_updated",
  "renewal_deleted",
  "leak_alerts_changed",
  "monthly_report_changed",
  "trial_reminders_changed",
]);

const DETAIL_KEYS = new Set([
  "findingId",
  "membershipId",
  "ownerMembershipId",
  "skuId",
  "monthlyPriceCents",
  "orgRef",
  "inactiveDays",
  "renewalDate",
  "credType",
  "to",
]);

export const syncStepLabel = (t: Translator, step: string) => {
  const providerMatch = /^(.+)Seats$/.exec(step);
  if (providerMatch?.[1]) {
    return t("labels.syncSteps.providerSeats", {
      provider: words(providerMatch[1]),
    });
  }
  if (SYNC_STEP_KEYS.has(step)) {
    return t(`labels.syncSteps.${step}`);
  }
  return words(step);
};

export const auditActionLabel = (t: Translator, action: string) =>
  ACTION_KEYS.has(action) ? t(`labels.actions.${action}`) : words(action);

export const auditDetailLabel = (t: Translator, key: string) =>
  DETAIL_KEYS.has(key) ? t(`labels.details.${key}`) : words(key);
