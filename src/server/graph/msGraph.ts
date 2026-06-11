import { ConfidentialClientApplication } from "@azure/msal-node";

import { env } from "~/env";
import { csvToRecords, reportDate } from "./reportCsv";
import {
  GraphHttpError,
  PremiumLicenseRequiredError,
  type CopilotUsageRow,
  type GraphClient,
  type GraphSubscribedSku,
  type GraphUser,
  type UsageReportRow,
} from "./types";

const GRAPH = "https://graph.microsoft.com/v1.0";

/** One confidential client per customer tenant; MSAL caches tokens internally. */
const msalApps = new Map<string, ConfidentialClientApplication>();

/**
 * Right after admin consent, the freshly created service principal can take a
 * minute to propagate to the token service — first syncs would always fail
 * without a retry on this class of error.
 */
const CONSENT_PROPAGATION_PATTERNS =
  /could not be established|AADSTS700016|AADSTS7000229|was not found in the directory/i;

const getAppToken = async (tid: string): Promise<string> => {
  if (!env.CONNECTOR_CLIENT_ID || !env.CONNECTOR_CLIENT_SECRET) {
    throw new Error(
      "CONNECTOR_CLIENT_ID / CONNECTOR_CLIENT_SECRET are not configured",
    );
  }
  let app = msalApps.get(tid);
  if (!app) {
    app = new ConfidentialClientApplication({
      auth: {
        clientId: env.CONNECTOR_CLIENT_ID,
        clientSecret: env.CONNECTOR_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${tid}`,
      },
    });
    msalApps.set(tid, app);
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await app.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
      });
      if (!result?.accessToken) {
        throw new Error(`Failed to acquire app-only token for tenant ${tid}`);
      }
      return result.accessToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < 3 && CONSENT_PROPAGATION_PATTERNS.test(message)) {
        await sleep(15_000);
        continue;
      }
      throw err;
    }
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GraphErrorBody = { error?: { code?: string; message?: string } };

/** Fetch with Graph throttling etiquette: respect Retry-After on 429/503, max 4 tries. */
const graphFetch = async (token: string, url: string): Promise<Response> => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "follow",
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt >= 3) {
        throw new GraphHttpError(res.status, "throttled", "Graph throttling persisted");
      }
      const retryAfter = Number(res.headers.get("retry-after") ?? "2");
      await sleep(Math.min(retryAfter, 30) * 1000);
      continue;
    }
    if (!res.ok) {
      let code: string | null = null;
      let message = `${res.status} ${res.statusText}`;
      try {
        const body = (await res.json()) as GraphErrorBody;
        code = body.error?.code ?? null;
        message = body.error?.message ?? message;
      } catch {
        // non-JSON error body; keep the status text
      }
      throw new GraphHttpError(res.status, code, message);
    }
    return res;
  }
};

const getAllPages = async <T>(token: string, firstUrl: string): Promise<T[]> => {
  const items: T[] = [];
  let url: string | undefined = firstUrl;
  while (url) {
    const res = await graphFetch(token, url);
    const body = (await res.json()) as { value: T[]; "@odata.nextLink"?: string };
    items.push(...body.value);
    url = body["@odata.nextLink"];
  }
  return items;
};

const USER_FIELDS =
  "id,displayName,userPrincipalName,accountEnabled,userType,createdDateTime,assignedLicenses,licenseAssignmentStates";

export class MsGraphClient implements GraphClient {
  constructor(private readonly tid: string) {}

  async getOrganizationName(): Promise<string | null> {
    try {
      const token = await getAppToken(this.tid);
      const res = await graphFetch(
        token,
        `${GRAPH}/organization?$select=displayName`,
      );
      const body = (await res.json()) as { value?: { displayName?: string }[] };
      return body.value?.[0]?.displayName ?? null;
    } catch {
      return null;
    }
  }

  async getSubscribedSkus(): Promise<GraphSubscribedSku[]> {
    const token = await getAppToken(this.tid);
    return getAllPages<GraphSubscribedSku>(token, `${GRAPH}/subscribedSkus`);
  }

  async getReportConcealment(): Promise<boolean | null> {
    const token = await getAppToken(this.tid);
    try {
      const res = await graphFetch(token, `${GRAPH}/admin/reportSettings`);
      const body = (await res.json()) as { displayConcealedNames?: boolean };
      return body.displayConcealedNames ?? null;
    } catch {
      // ReportSettings.Read.All might not be granted on older consents.
      return null;
    }
  }

  async listUsers(opts: { includeSignInActivity: boolean }): Promise<GraphUser[]> {
    const token = await getAppToken(this.tid);
    const select = opts.includeSignInActivity
      ? `${USER_FIELDS},signInActivity`
      : USER_FIELDS;
    // signInActivity caps the page size at lower limits; 250 is safe for both shapes.
    const url = `${GRAPH}/users?$select=${select}&$top=250`;
    try {
      return await getAllPages<GraphUser>(token, url);
    } catch (err) {
      if (
        opts.includeSignInActivity &&
        err instanceof GraphHttpError &&
        (err.code === "Authentication_RequestFromNonPremiumTenantOrB2CTenant" ||
          /premium/i.test(err.message))
      ) {
        throw new PremiumLicenseRequiredError(err.message);
      }
      throw err;
    }
  }

  async getActiveUserDetail(period: "D90"): Promise<UsageReportRow[]> {
    const token = await getAppToken(this.tid);
    const res = await graphFetch(
      token,
      `${GRAPH}/reports/getOffice365ActiveUserDetail(period='${period}')`,
    );
    const text = await res.text();
    return csvToRecords(text).map((r) => ({
      userPrincipalName: r["User Principal Name"] ?? "",
      exchangeLastActivityDate: reportDate(r["Exchange Last Activity Date"]),
      oneDriveLastActivityDate: reportDate(r["OneDrive Last Activity Date"]),
      sharePointLastActivityDate: reportDate(r["SharePoint Last Activity Date"]),
      teamsLastActivityDate: reportDate(r["Teams Last Activity Date"]),
    }));
  }

  async getCopilotUsage(period: "D90"): Promise<CopilotUsageRow[]> {
    const token = await getAppToken(this.tid);
    const res = await graphFetch(
      token,
      `${GRAPH}/copilot/reports/getMicrosoft365CopilotUsageUserDetail(period='${period}')?$format=text/csv`,
    );
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      const body = (await res.json()) as {
        value?: { userPrincipalName?: string; lastActivityDate?: string | null }[];
      };
      return (body.value ?? []).map((r) => ({
        userPrincipalName: r.userPrincipalName ?? "",
        lastActivityDate: r.lastActivityDate ?? null,
      }));
    }
    const text = await res.text();
    return csvToRecords(text).map((r) => ({
      userPrincipalName: r["User Principal Name"] ?? "",
      lastActivityDate: reportDate(r["Last Activity Date"]),
    }));
  }
}
