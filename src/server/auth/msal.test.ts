import { describe, expect, it } from "vitest";

import { CONNECTOR_SCOPES } from "~/lib/scopes";

// msal.ts pulls ~/env at import; provide the only required test-env var
// before the dynamic import below.
process.env.AUTH_SECRET ??= "test-secret-test-secret";

const { SCAN_SCOPES } = await import("~/server/auth/msal");

describe("SCAN_SCOPES", () => {
  it("stays in lockstep with the connector's application permissions", () => {
    expect(SCAN_SCOPES).toEqual(CONNECTOR_SCOPES.map((s) => s.scope));
  });

  it("contains exactly the five read-only Graph permissions", () => {
    expect([...SCAN_SCOPES].sort()).toEqual(
      [
        "AuditLog.Read.All",
        "LicenseAssignment.Read.All",
        "Reports.Read.All",
        "ReportSettings.Read.All",
        "User.Read.All",
      ].sort(),
    );
  });

  it("never requests offline_access — the scan token is one-shot by design", () => {
    expect(SCAN_SCOPES).not.toContain("offline_access");
  });
});
