import type { SaasSeat } from "~/server/types";
import type { SaasClient } from "~/server/saas/registry";

const TOKEN_URL = "https://zoom.us/oauth/token";
const API_BASE = "https://api.zoom.us/v2";

type ZoomApiUser = {
  email?: string;
  first_name?: string;
  last_name?: string;
  /** 1 = Basic (free), 2 = Licensed, 99 = None. */
  type?: number;
  status?: string;
  last_login_time?: string;
};

/** Only Licensed seats cost money; Basic users are free and ignored. */
export const mapZoomUsers = (users: ZoomApiUser[]): SaasSeat[] =>
  users
    .filter((u) => u.email && u.type === 2)
    .map((u) => ({
      email: u.email!,
      displayName:
        [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
      status: u.status ?? "active",
      products: ["Licensed"],
      lastActiveAt: u.last_login_time ? new Date(u.last_login_time) : null,
    }));

/**
 * Zoom Server-to-Server OAuth app (account-level, created by a Zoom admin).
 * One scope is enough: user:read:list_users:admin (the granular scope for the
 * GET /users list endpoint below; classic user:read:admin is deprecated for new
 * apps). last_login_time comes back on the user object itself, so inactivity
 * needs no extra report call.
 */
export class ZoomClient implements SaasClient {
  constructor(
    private readonly cfg: {
      accountId: string;
      clientId: string;
      clientSecret: string;
    },
  ) {}

  private async getToken(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: "account_credentials",
      account_id: this.cfg.accountId,
    });
    const res = await fetch(`${TOKEN_URL}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.cfg.clientId}:${this.cfg.clientSecret}`,
        ).toString("base64")}`,
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Zoom token request failed (${res.status})`);
    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token)
      throw new Error("Zoom token response missing access_token");
    return body.access_token;
  }

  async getSeats(): Promise<SaasSeat[]> {
    const token = await this.getToken();
    const seats: SaasSeat[] = [];
    let nextPageToken = "";
    for (let page = 0; page < 100; page++) {
      const params = new URLSearchParams({
        page_size: "300",
        status: "active",
      });
      if (nextPageToken) params.set("next_page_token", nextPageToken);
      const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Zoom users request failed (${res.status})`);
      const body = (await res.json()) as {
        users?: ZoomApiUser[];
        next_page_token?: string;
      };
      seats.push(...mapZoomUsers(body.users ?? []));
      nextPageToken = body.next_page_token ?? "";
      if (!nextPageToken) break;
    }
    return seats;
  }
}
