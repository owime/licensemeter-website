import { describe, expect, it } from "vitest";

import {
  detectConcealment,
  mapLicenses,
  parseDirectoryExport,
  parseUsageExport,
  type CsvHeaderError,
  type DirectoryRow,
  type UsageRow,
} from "./csvTrial";

const dirRow = (overrides: Partial<DirectoryRow>): DirectoryRow => ({
  upn: "a@contoso.com",
  displayName: null,
  accountEnabled: true,
  licenseNames: [],
  ...overrides,
});

const usageRow = (overrides: Partial<UsageRow>): UsageRow => ({
  upn: "a@contoso.com",
  lastActivity: null,
  workloadActivity: {
    exchange: null,
    oneDrive: null,
    sharePoint: null,
    teams: null,
    copilot: null,
  },
  ...overrides,
});

describe("parseDirectoryExport", () => {
  it("parses the classic English export headers", () => {
    const csv = [
      "User principal name,Display name,First name,Block credential,Licenses,When created",
      "anna@contoso.com,Anna Admin,Anna,False,Microsoft 365 E3,2023-01-01",
      "bob@contoso.com,Bob Blocked,Bob,True,Office 365 E1+Power BI Pro,2023-01-02",
    ].join("\n");
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        upn: "anna@contoso.com",
        displayName: "Anna Admin",
        accountEnabled: true,
        licenseNames: ["Microsoft 365 E3"],
      },
      {
        upn: "bob@contoso.com",
        displayName: "Bob Blocked",
        accountEnabled: false,
        licenseNames: ["Office 365 E1", "Power BI Pro"],
      },
    ]);
  });

  it("parses German export headers", () => {
    const csv = [
      "Benutzerprinzipalname,Anzeigename,Anmeldeinformationen blockieren,Lizenzen",
      "uwe@contoso.de,Uwe Beispiel,Wahr,Microsoft 365 Business Premium",
    ].join("\n");
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        upn: "uwe@contoso.de",
        displayName: "Uwe Beispiel",
        accountEnabled: false,
        licenseNames: ["Microsoft 365 Business Premium"],
      },
    ]);
  });

  it("handles quoted cells containing commas, header casing and blank lines", () => {
    const csv = [
      "USER PRINCIPAL NAME,DISPLAY NAME,LICENSES",
      '"doe@contoso.com","Doe, Jane","Microsoft 365 E5"',
      "",
      "  ,",
    ].join("\n");
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        upn: "doe@contoso.com",
        displayName: "Doe, Jane",
        accountEnabled: true,
        licenseNames: ["Microsoft 365 E5"],
      },
    ]);
  });

  it("treats a blocked sign-in status column as disabled", () => {
    const csv = [
      "Username,Display name,Sign-in status,Licenses",
      "x@contoso.com,X,Blocked,Office 365 E1",
      "y@contoso.com,Y,Allowed,Office 365 E1",
    ].join("\n");
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]!.accountEnabled).toBe(false);
    expect(result.rows[1]!.accountEnabled).toBe(true);
  });

  it("defaults to enabled and null display name when optional columns are absent", () => {
    const csv = ["User principal name,Licenses", "z@contoso.com,"].join("\n");
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        upn: "z@contoso.com",
        displayName: null,
        accountEnabled: true,
        licenseNames: [],
      },
    ]);
  });

  it("returns a structured error listing expected vs found headers", () => {
    const csv = "Email,Name\nx@contoso.com,X";
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(false);
    const err = result as CsvHeaderError;
    expect(err.expectedHeaders).toContain("user principal name");
    expect(err.expectedHeaders).toContain("licenses");
    expect(err.foundHeaders).toEqual(["email", "name"]);
    expect(err.error).toContain('"user principal name"');
    expect(err.error).toContain("email, name");
  });

  it("hints at semicolon-separated files", () => {
    const csv = "Benutzerprinzipalname;Anzeigename;Lizenzen\na@b.de;A;X";
    const result = parseDirectoryExport(csv);
    expect(result.ok).toBe(false);
    expect((result as CsvHeaderError).error).toContain("semicolon");
  });
});

describe("parseUsageExport", () => {
  it("parses the Graph-style usage detail export and takes the max activity date", () => {
    const csv = [
      "Report Refresh Date,User Principal Name,Display Name,Exchange Last Activity Date,OneDrive Last Activity Date,SharePoint Last Activity Date,Teams Last Activity Date",
      "2026-06-01,anna@contoso.com,Anna,2026-05-20,2026-05-28,,2026-04-01",
      "2026-06-01,bob@contoso.com,Bob,,,,",
    ].join("\n");
    const result = parseUsageExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]).toEqual({
      upn: "anna@contoso.com",
      lastActivity: new Date("2026-05-28"),
      workloadActivity: {
        exchange: "2026-05-20",
        oneDrive: "2026-05-28",
        sharePoint: null,
        teams: "2026-04-01",
        copilot: null,
      },
    });
    expect(result.rows[1]!.lastActivity).toBeNull();
  });

  it("accepts the admin-center metric labels and a plain last activity column", () => {
    const csv = [
      "Username,Last activity date",
      "anna@contoso.com,2026-06-02",
    ].join("\n");
    const result = parseUsageExport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]!.lastActivity).toEqual(new Date("2026-06-02"));
  });

  it("returns a structured error when no activity column exists", () => {
    const csv = "User Principal Name,Display Name\na@b.com,A";
    const result = parseUsageExport(csv);
    expect(result.ok).toBe(false);
    const err = result as CsvHeaderError;
    expect(err.expectedHeaders).toContain("exchange last activity date");
    expect(err.foundHeaders).toEqual(["user principal name", "display name"]);
  });
});

describe("detectConcealment", () => {
  it("flags hashed (no @) usage identities", () => {
    const directory = [dirRow({ upn: "anna@contoso.com" })];
    const usage = [usageRow({ upn: "0F61D1C9A8F1F2BC4A" })];
    expect(detectConcealment(directory, usage)).toBe(true);
  });

  it("flags usage files where fewer than 10% join the directory", () => {
    const directory = [
      dirRow({ upn: "anna@contoso.com" }),
      dirRow({ upn: "bob@contoso.com" }),
    ];
    const usage = Array.from({ length: 20 }, (_, i) =>
      usageRow({ upn: `other${i}@elsewhere.com` }),
    );
    expect(detectConcealment(directory, usage)).toBe(true);
  });

  it("passes when identities join case-insensitively", () => {
    const directory = [dirRow({ upn: "Anna@Contoso.com" })];
    const usage = [usageRow({ upn: "anna@contoso.com" })];
    expect(detectConcealment(directory, usage)).toBe(false);
  });

  it("is false without a usage file", () => {
    expect(detectConcealment([dirRow({})], [])).toBe(false);
  });
});

describe("mapLicenses", () => {
  it("matches catalog display names case-insensitively", () => {
    const { licenses, skus } = mapLicenses(["microsoft 365 e3"]);
    expect(licenses).toEqual([
      {
        skuId: "05e9a617-0261-4cee-bb44-138d3ef5d965",
        assignedByGroup: null,
        disabledPlans: [],
        state: "Active",
      },
    ]);
    expect(skus).toEqual([
      {
        skuId: "05e9a617-0261-4cee-bb44-138d3ef5d965",
        partNumber: "SPE_E3",
        displayName: "Microsoft 365 E3",
        isSynthetic: false,
      },
    ]);
  });

  it("matches part numbers case-insensitively", () => {
    const { skus } = mapLicenses(["enterprisepack"]);
    expect(skus[0]).toMatchObject({
      skuId: "6fd2c87f-b296-42f0-b197-1e91e994b900",
      displayName: "Office 365 E3",
      isSynthetic: false,
    });
  });

  it("produces synthetic SKUs for unmatched names, keeping the original for display", () => {
    const { licenses, skus } = mapLicenses(["Contoso Custom Suite (Add-on)"]);
    expect(licenses[0]!.skuId).toBe("csv:contoso-custom-suite-add-on");
    expect(skus[0]).toEqual({
      skuId: "csv:contoso-custom-suite-add-on",
      partNumber: "Contoso Custom Suite (Add-on)",
      displayName: "Contoso Custom Suite (Add-on)",
      isSynthetic: true,
    });
  });

  it("handles multi-license input and deduplicates repeats", () => {
    const { licenses, skus } = mapLicenses([
      "Microsoft 365 E3",
      "Power BI Pro",
      "MICROSOFT 365 E3",
    ]);
    expect(licenses).toHaveLength(2);
    expect(skus.map((s) => s.displayName)).toEqual([
      "Microsoft 365 E3",
      "Power BI Pro",
    ]);
  });
});
