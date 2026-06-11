import { skuDisplayName } from "~/server/graph/skuCatalog";
import type { findings } from "~/server/db/schema";

type FindingRow = typeof findings.$inferSelect;

type LicenseDetail = {
  skuId: string;
  name?: string;
  assignedByGroup?: string | null;
};

const RULE_HEADERS: Record<string, string> = {
  disabled_account_with_license: "Disabled accounts still holding licenses",
  never_active: "Licensed users who never became active",
  inactive_90d: "Licensed users inactive for 90+ days",
  copilot_unused: "Unused Copilot seats",
  licensed_guest: "Licensed guest accounts",
  shelfware: "Unassigned paid seats",
};

/**
 * Generates a reviewable PowerShell script (Microsoft Graph PowerShell SDK)
 * instead of writing to the tenant: LicenseMeter itself stays read-only.
 */
export const generateRemediationScript = (rows: FindingRow[]): string => {
  const lines: string[] = [
    "# LicenseMeter remediation script (generated)",
    "# Review every line before running. Requires the Microsoft Graph PowerShell SDK",
    "# and a role allowed to manage licenses (e.g. License Administrator).",
    "#",
    "# Connect-MgGraph -Scopes 'User.ReadWrite.All'",
    "",
  ];

  const byRule = new Map<string, FindingRow[]>();
  for (const f of rows) {
    const list = byRule.get(f.rule) ?? [];
    list.push(f);
    byRule.set(f.rule, list);
  }

  for (const [rule, items] of byRule) {
    lines.push(`# ===== ${RULE_HEADERS[rule] ?? rule} =====`);
    for (const f of items) {
      const detail = f.detail as {
        upn?: string;
        licenses?: LicenseDetail[];
        aggregate?: boolean;
        unassigned?: number;
        skuPartNumber?: string;
      };

      if (rule === "shelfware") {
        lines.push(
          `# ${f.title}`,
          `#   Reduce the seat count at the next renewal (Microsoft 365 admin center > Billing > Your products,`,
          `#   or through your CSP). SKU: ${f.skuId ? skuDisplayName(f.skuId, detail.skuPartNumber) : "unknown"}.`,
          "",
        );
        continue;
      }

      if (detail.aggregate) {
        lines.push(
          `# ${f.title}`,
          `#   Identities are concealed in usage reports. Enable identifiable names`,
          `#   (Org settings > Reports) and re-sync to get per-user commands.`,
          "",
        );
        continue;
      }

      if (!detail.upn) continue;
      lines.push(`# ${f.title}`);

      const licenses: LicenseDetail[] =
        detail.licenses ?? (f.skuId ? [{ skuId: f.skuId }] : []);
      const direct = licenses.filter((l) => !l.assignedByGroup);
      const viaGroup = licenses.filter((l) => l.assignedByGroup);

      if (direct.length > 0) {
        const skuList = direct.map((l) => `'${l.skuId}'`).join(", ");
        const upn = detail.upn.replaceAll("'", "''");
        lines.push(
          `Set-MgUserLicense -UserId '${upn}' -RemoveLicenses @(${skuList}) -AddLicenses @()`,
        );
      }
      for (const l of viaGroup) {
        lines.push(
          `# ${skuDisplayName(l.skuId, l.name)} is inherited from group ${l.assignedByGroup} -`,
          `#   remove '${detail.upn}' from that group instead of unassigning directly.`,
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n");
};
