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
    const next = body["@odata.nextLink"];
    // Defense in depth: never follow pagination off graph.microsoft.com.
    if (next && !next.startsWith("https://graph.microsoft.com/")) {
      throw new GraphHttpError(502, "bad_next_link", "Unexpected nextLink host");
    }
    url = next;
  }
  return items;
};

const USER_FIELDS =
  "id,displayName,userPrincipalName,accountEnabled,userType,createdDateTime,assignedLicenses,licenseAssignmentStates";

/** Office 365 active-user-detail CSV -> usage rows (shared by both clients). */
const fetchActiveUserDetail = async (
  token: string,
  period: "D90",
): Promise<UsageReportRow[]> => {
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
};

/** Copilot usage report (CSV or JSON shape) -> rows (shared by both clients). */
const fetchCopilotUsage = async (
  token: string,
  period: "D90",
): Promise<CopilotUsageRow[]> => {
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
};

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
    return fetchActiveUserDetail(token, period);
  }

  async getCopilotUsage(period: "D90"): Promise<CopilotUsageRow[]> {
    const token = await getAppToken(this.tid);
    return fetchCopilotUsage(token, period);
  }
}

/** 401/403 — the delegated caller lacks the directory role for this read. */
const isAuthDenied = (err: unknown): boolean =>
  err instanceof GraphHttpError && (err.status === 401 || err.status === 403);

/**
 * GraphClient over a delegated user access token — the one-shot instant
 * scan. Unlike the app-only client, delegated reads are bounded by the
 * signed-in USER'S directory roles on top of the consented scopes: usage
 * and Copilot reports need a reports-capable role (Reports Reader, Global
 * Reader, ...), signInActivity additionally needs Entra ID P1, and
 * /admin/reportSettings is admin-only. Every role-bounded source therefore
 * degrades on 401/403 into the same signal-absent shapes the sync pipeline
 * already handles for non-P1/concealed tenants. Only the directory reads
 * (users, subscribedSkus) may fail the scan — without them there is nothing
 * to analyze.
 */
export class DelegatedGraphClient implements GraphClient {
  constructor(private readonly accessToken: string) {}

  async getOrganizationName(): Promise<string | null> {
    try {
      const res = await graphFetch(
        this.accessToken,
        `${GRAPH}/organization?$select=displayName`,
      );
      const body = (await res.json()) as { value?: { displayName?: string }[] };
      return body.value?.[0]?.displayName ?? null;
    } catch {
      return null;
    }
  }

  async getSubscribedSkus(): Promise<GraphSubscribedSku[]> {
    // Plain directory read (delegated LicenseAssignment.Read.All suffices,
    // no role needed). Critical — a failure here fails the scan, same as
    // the app-only sync.
    return getAllPages<GraphSubscribedSku>(
      this.accessToken,
      `${GRAPH}/subscribedSkus`,
    );
  }

  async getReportConcealment(): Promise<boolean | null> {
    try {
      const res = await graphFetch(
        this.accessToken,
        `${GRAPH}/admin/reportSettings`,
      );
      const body = (await res.json()) as { displayConcealedNames?: boolean };
      return body.displayConcealedNames ?? null;
    } catch {
      // Admin-only endpoint: most scan users get a 403 here. Unknown
      // concealment is handled downstream (joined.concealed fallback).
      return null;
    }
  }

  async listUsers(opts: { includeSignInActivity: boolean }): Promise<GraphUser[]> {
    const select = opts.includeSignInActivity
      ? `${USER_FIELDS},signInActivity`
      : USER_FIELDS;
    const url = `${GRAPH}/users?$select=${select}&$top=250`;
    try {
      return await getAllPages<GraphUser>(this.accessToken, url);
    } catch (err) {
      // signInActivity is doubly gated for delegated callers: tenant P1 AND
      // an auditlog-capable user role. Either denial degrades the same way —
      // the sync retries without sign-in data and falls back to usage reports.
      if (
        opts.includeSignInActivity &&
        (isAuthDenied(err) ||
          (err instanceof GraphHttpError &&
            (err.code === "Authentication_RequestFromNonPremiumTenantOrB2CTenant" ||
              /premium/i.test(err.message))))
      ) {
        throw new PremiumLicenseRequiredError(
          err instanceof Error ? err.message : String(err),
        );
      }
      throw err; // plain user list failing is fatal — nothing to analyze
    }
  }

  async getActiveUserDetail(period: "D90"): Promise<UsageReportRow[]> {
    // Role-bounded: throws GraphHttpError 403 without Reports Reader/Global
    // Reader. The sync records the failure as a warning and the join treats
    // the missing rows as "no activity signal" — never a thrown scan.
    return fetchActiveUserDetail(this.accessToken, period);
  }

  async getCopilotUsage(period: "D90"): Promise<CopilotUsageRow[]> {
    // Role-bounded like the usage report; failure -> warning step and
    // copilotSignal "none" downstream.
    return fetchCopilotUsage(this.accessToken, period);
  }
}
