import { getTranslations } from "next-intl/server";

/**
 * User-facing messages for the ?error= codes the Microsoft connect/scan flows
 * redirect back with. Shared by the Microsoft connector page and the CSV import.
 */
const CODES = [
  "not_configured",
  "missing_state",
  "invalid_state",
  "expired_state",
  "consent_declined",
  "consent_incomplete",
  "not_allowed",
  "tenant_taken",
  "already_connected",
  "scan_declined",
  "scan_needs_admin",
  "scan_demo",
  "scan_already_synced",
  "scan_already_synced_invite",
  "scan_workspace_invite",
  "scan_workspace_role",
  "scan_mismatch",
] as const;

type ConnectErrorCode = (typeof CODES)[number];

const isConnectErrorCode = (
  value: string | null | undefined,
): value is ConnectErrorCode => CODES.includes(value as ConnectErrorCode);

export const connectErrorText = async (
  code: string | null | undefined,
): Promise<string> => {
  const t = await getTranslations("connectErrors");
  return isConnectErrorCode(code) ? t(code) : t("generic");
};
