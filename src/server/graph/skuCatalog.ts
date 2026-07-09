/**
 * Static catalog of common Microsoft SKUs: GUID -> friendly name + approximate
 * EUR list price. GUIDs are from Microsoft's published "Product names and
 * service plan identifiers for licensing" reference and are stable.
 *
 * Prices are estimates of public list prices (monthly, per user, annual
 * commitment). There is no Microsoft API for tenant pricing, so the per-tenant
 * price book is prefilled from these values and the customer adjusts them to
 * their agreement. Unknown SKUs fall back to a prettified part number and 0.
 */

export type CatalogEntry = {
  partNumber: string;
  name: string;
  defaultMonthlyPriceCents: number;
};

export const SKU_CATALOG: Record<string, CatalogEntry> = {
  // Microsoft 365 / Office 365 suites
  "18181a46-0d4e-45cd-891e-60aabd171b4e": {
    partNumber: "STANDARDPACK",
    name: "Office 365 E1",
    defaultMonthlyPriceCents: 940,
  },
  "6fd2c87f-b296-42f0-b197-1e91e994b900": {
    partNumber: "ENTERPRISEPACK",
    name: "Office 365 E3",
    defaultMonthlyPriceCents: 2420,
  },
  "c7df2760-2c81-4ef7-b578-5b5392b571df": {
    partNumber: "ENTERPRISEPREMIUM",
    name: "Office 365 E5",
    defaultMonthlyPriceCents: 3970,
  },
  "05e9a617-0261-4cee-bb44-138d3ef5d965": {
    partNumber: "SPE_E3",
    name: "Microsoft 365 E3",
    defaultMonthlyPriceCents: 3670,
  },
  "06ebc4ee-1bb5-47dd-8120-11324bc54e06": {
    partNumber: "SPE_E5",
    name: "Microsoft 365 E5",
    defaultMonthlyPriceCents: 5750,
  },
  "3b555118-da6a-4418-894f-7df1e2096870": {
    partNumber: "O365_BUSINESS_ESSENTIALS",
    name: "Microsoft 365 Business Basic",
    defaultMonthlyPriceCents: 620,
  },
  "f245ecc8-75af-4f8e-b61f-27d8114de5f3": {
    partNumber: "O365_BUSINESS_PREMIUM",
    name: "Microsoft 365 Business Standard",
    defaultMonthlyPriceCents: 1300,
  },
  "cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46": {
    partNumber: "SPB",
    name: "Microsoft 365 Business Premium",
    defaultMonthlyPriceCents: 2300,
  },
  "66b55226-6b4f-492c-910c-a3b7a3c9d993": {
    partNumber: "SPE_F1",
    name: "Microsoft 365 F3",
    defaultMonthlyPriceCents: 750,
  },
  "4b585984-651b-448a-9e53-3b10f069cf7f": {
    partNumber: "DESKLESSPACK",
    name: "Office 365 F3",
    defaultMonthlyPriceCents: 400,
  },

  // Copilot
  "639dec6b-bb19-468b-871c-c5c441c4b0cb": {
    partNumber: "Microsoft_365_Copilot",
    name: "Microsoft 365 Copilot",
    defaultMonthlyPriceCents: 2810,
  },

  // Security & identity
  "efccb6f7-5641-4e0e-bd10-b4976e1bf68e": {
    partNumber: "EMS",
    name: "Enterprise Mobility + Security E3",
    defaultMonthlyPriceCents: 980,
  },
  "b05e124f-c7cc-45a0-a6aa-8cf78c946968": {
    partNumber: "EMSPREMIUM",
    name: "Enterprise Mobility + Security E5",
    defaultMonthlyPriceCents: 1520,
  },
  "078d2b04-f1bd-4111-bbd4-b4b1b354cef4": {
    partNumber: "AAD_PREMIUM",
    name: "Microsoft Entra ID P1",
    defaultMonthlyPriceCents: 560,
  },
  "84a661c4-e949-4bd2-a560-ed7766fcaf2b": {
    partNumber: "AAD_PREMIUM_P2",
    name: "Microsoft Entra ID P2",
    defaultMonthlyPriceCents: 840,
  },
  "061f9ace-7d42-4136-88ac-31dc755f143f": {
    partNumber: "INTUNE_A",
    name: "Microsoft Intune Plan 1",
    defaultMonthlyPriceCents: 750,
  },
  "4ef96642-f096-40de-a3e9-d83fb2f90211": {
    partNumber: "ATP_ENTERPRISE",
    name: "Defender for Office 365 Plan 1",
    defaultMonthlyPriceCents: 190,
  },
  "3dd6cf57-d688-4eed-ba52-9e40b5468c3e": {
    partNumber: "THREAT_INTELLIGENCE",
    name: "Defender for Office 365 Plan 2",
    defaultMonthlyPriceCents: 470,
  },

  // Workloads & add-ons
  "4b9405b0-7788-4568-add1-99614e613b69": {
    partNumber: "EXCHANGESTANDARD",
    name: "Exchange Online Plan 1",
    defaultMonthlyPriceCents: 370,
  },
  "19ec0d23-8335-4cbd-94ac-6050e30712fa": {
    partNumber: "EXCHANGEENTERPRISE",
    name: "Exchange Online Plan 2",
    defaultMonthlyPriceCents: 750,
  },
  "f8a1db68-be16-40ed-86d5-cb42ce701560": {
    partNumber: "POWER_BI_PRO",
    name: "Power BI Pro",
    defaultMonthlyPriceCents: 1310,
  },
  "53818b1b-4a27-454b-8896-0dba576410e6": {
    partNumber: "PROJECTPROFESSIONAL",
    name: "Project Plan 3",
    defaultMonthlyPriceCents: 2800,
  },
  "c5928f49-12ba-48f7-ada3-0d743a3601d5": {
    partNumber: "VISIOCLIENT",
    name: "Visio Plan 2",
    defaultMonthlyPriceCents: 1400,
  },
  "e43b5b99-8dfb-405f-9987-dc307f34bcbd": {
    partNumber: "MCOEV",
    name: "Teams Phone Standard",
    defaultMonthlyPriceCents: 750,
  },
  "0c266dff-15dd-4b49-8397-2bb16070ed52": {
    partNumber: "MCOMEETADV",
    name: "Audio Conferencing",
    defaultMonthlyPriceCents: 400,
  },
};

const prettifyPartNumber = (partNumber: string): string =>
  partNumber
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) =>
      w.length > 3 ? w[0]!.toUpperCase() + w.slice(1) : w.toUpperCase(),
    )
    .join(" ");

export const skuDisplayName = (
  skuId: string,
  partNumber?: string | null,
): string => {
  const entry = SKU_CATALOG[skuId];
  if (entry) return entry.name;
  if (partNumber) return prettifyPartNumber(partNumber);
  return skuId;
};

export const skuDefaultPriceCents = (skuId: string): number =>
  SKU_CATALOG[skuId]?.defaultMonthlyPriceCents ?? 0;
