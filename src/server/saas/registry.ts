import type { SaasProvider, SaasSeat } from "~/server/types";
import { demoUpn } from "~/server/graph/demoGraph";

export interface SaasClient {
  getSeats(): Promise<SaasSeat[]>;
}

/** Decrypted credentials as stored on saas_connections. */
export type SaasCredentials = {
  orgRef: string;
  clientId: string | null;
  secret: string;
};

const daysAgo = (n: number): Date =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/**
 * Demo fixtures per provider. Distinct disabled leavers (Entra demo users
 * 138-145 are the disabled bucket; Adobe already uses 138/139) so the demo
 * shows different people leaking in different apps, the way real tenants do.
 */
const DEMO_SEATS: Record<SaasProvider, () => SaasSeat[]> = {
  zoom: () => [
    // Disabled in Entra, still licensed in Zoom.
    {
      email: demoUpn(140),
      displayName: "Demo Leaver Zoom",
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(130),
    },
    // Active account that simply stopped using Zoom (Teams won).
    {
      email: demoUpn(20),
      displayName: null,
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(150),
    },
    {
      email: demoUpn(21),
      displayName: null,
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(170),
    },
    // No Entra account at all.
    {
      email: "extern.moderator@webinar-agentur.example",
      displayName: "Extern Moderator",
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(40),
    },
    // Healthy seats.
    {
      email: demoUpn(1),
      displayName: null,
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(3),
    },
    {
      email: demoUpn(2),
      displayName: null,
      status: "active",
      products: ["Licensed"],
      lastActiveAt: daysAgo(9),
    },
  ],
  atlassian: () => [
    // Disabled in Entra, holding Jira + Confluence.
    {
      email: demoUpn(141),
      displayName: "Demo Leaver Atlassian",
      status: "active",
      products: ["Jira Software", "Confluence"],
      lastActiveAt: daysAgo(140),
    },
    // Active in Entra, has not opened Jira in months.
    {
      email: demoUpn(22),
      displayName: null,
      status: "active",
      products: ["Jira Software"],
      lastActiveAt: daysAgo(200),
    },
    // Orphan.
    {
      email: "agentur.dev@externes-studio.example",
      displayName: "Externes Studio",
      status: "active",
      products: ["Jira Software"],
      lastActiveAt: daysAgo(15),
    },
    // Healthy.
    {
      email: demoUpn(3),
      displayName: null,
      status: "active",
      products: ["Jira Software", "Confluence"],
      lastActiveAt: daysAgo(1),
    },
    {
      email: demoUpn(4),
      displayName: null,
      status: "active",
      products: ["Confluence"],
      lastActiveAt: daysAgo(6),
    },
  ],
  salesforce: () => [
    // The expensive one: a disabled account still holding a full CRM seat.
    {
      email: demoUpn(142),
      displayName: "Demo Leaver Salesforce",
      status: "active",
      products: ["Salesforce"],
      lastActiveAt: daysAgo(120),
    },
    // Healthy.
    {
      email: demoUpn(5),
      displayName: null,
      status: "active",
      products: ["Salesforce"],
      lastActiveAt: daysAgo(2),
    },
    {
      email: demoUpn(6),
      displayName: null,
      status: "active",
      products: ["Salesforce"],
      lastActiveAt: daysAgo(5),
    },
  ],
};

class DemoSaasClient implements SaasClient {
  constructor(private readonly provider: SaasProvider) {}
  getSeats(): Promise<SaasSeat[]> {
    return Promise.resolve(DEMO_SEATS[this.provider]());
  }
}

/** Demo price estimates per product, in cents (editable in the price book). */
export const DEMO_SAAS_PRICES: Record<string, number> = {
  "zoom:Licensed": 1399,
  "atlassian:Jira Software": 800,
  "atlassian:Confluence": 600,
  "salesforce:Salesforce": 16500,
};

export const SAAS_PROVIDERS: SaasProvider[] = [
  "zoom",
  "atlassian",
  "salesforce",
];

export const isSaasProvider = (v: string): v is SaasProvider =>
  (SAAS_PROVIDERS as string[]).includes(v);

export const buildSaasClient = async (
  provider: SaasProvider,
  creds: SaasCredentials,
): Promise<SaasClient> => {
  switch (provider) {
    case "zoom": {
      const { ZoomClient } = await import("~/server/saas/zoom");
      return new ZoomClient({
        accountId: creds.orgRef,
        clientId: creds.clientId ?? "",
        clientSecret: creds.secret,
      });
    }
    case "atlassian": {
      const { AtlassianClient } = await import("~/server/saas/atlassian");
      return new AtlassianClient({
        orgId: creds.orgRef,
        apiKey: creds.secret,
      });
    }
    case "salesforce": {
      const { SalesforceClient } = await import("~/server/saas/salesforce");
      return new SalesforceClient({
        instanceUrl: creds.orgRef,
        clientId: creds.clientId ?? "",
        clientSecret: creds.secret,
      });
    }
  }
};

export const demoSaasClient = (provider: SaasProvider): SaasClient =>
  new DemoSaasClient(provider);
