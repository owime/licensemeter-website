/** The connector app's Graph application permissions — all read-only. */
export const CONNECTOR_SCOPES = [
  {
    scope: "User.Read.All",
    why: "directory users, enabled state, assigned licenses",
  },
  {
    scope: "AuditLog.Read.All",
    why: "last sign-in timestamps (needs Entra ID P1)",
  },
  {
    scope: "Reports.Read.All",
    why: "usage and Copilot activity reports",
  },
  {
    scope: "LicenseAssignment.Read.All",
    why: "purchased vs assigned seat counts",
  },
  {
    scope: "ReportSettings.Read.All",
    why: "whether report names are concealed",
  },
] as const;
