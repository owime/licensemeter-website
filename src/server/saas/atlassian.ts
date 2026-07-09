import type { SaasSeat } from "~/server/types";
import type { SaasClient } from "~/server/saas/registry";

const API_BASE = "https://api.atlassian.com";

type AtlassianApiUser = {
  email?: string;
  name?: string;
  account_status?: string;
  product_access?: {
    key?: string;
    name?: string;
    last_active?: string;
  }[];
};

/**
 * Billing follows product access: only users holding at least one product
 * seat are kept. lastActiveAt is the freshest last_active across products;
 * Atlassian omits it for never-active users, which maps to null here.
 */
export const mapAtlassianUsers = (users: AtlassianApiUser[]): SaasSeat[] =>
  users
    .filter(
      (u) =>
        u.email &&
        u.account_status === "active" &&
        (u.product_access?.length ?? 0) > 0,
    )
    .map((u) => {
      const lastActives = (u.product_access ?? [])
        .map((p) => (p.last_active ? new Date(p.last_active).getTime() : 0))
        .filter((t) => t > 0);
      return {
        email: u.email!,
        displayName: u.name ?? null,
        status: "active",
        products: [
          ...new Set(
            (u.product_access ?? []).map((p) => p.name ?? p.key ?? "Unknown"),
          ),
        ],
        lastActiveAt:
          lastActives.length > 0 ? new Date(Math.max(...lastActives)) : null,
      };
    });

/**
 * Atlassian organization Admin API with a plain org API key that an org
 * admin creates under admin.atlassian.com > Settings > API keys. Read-only:
 * managed users and their product access, nothing from inside the products.
 */
export class AtlassianClient implements SaasClient {
  constructor(private readonly cfg: { orgId: string; apiKey: string }) {}

  async getSeats(): Promise<SaasSeat[]> {
    const seats: SaasSeat[] = [];
    let url = `${API_BASE}/admin/v1/orgs/${encodeURIComponent(this.cfg.orgId)}/users`;
    for (let page = 0; page < 200; page++) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.cfg.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok)
        throw new Error(`Atlassian users request failed (${res.status})`);
      const body = (await res.json()) as {
        data?: AtlassianApiUser[];
        links?: { next?: string };
      };
      seats.push(...mapAtlassianUsers(body.data ?? []));
      const next = body.links?.next;
      if (!next) break;
      // The next link is absolute; never follow it off the Atlassian API host.
      const parsed = new URL(next, API_BASE);
      if (parsed.origin !== API_BASE)
        throw new Error("Atlassian pagination link left api.atlassian.com");
      url = parsed.toString();
    }
    return seats;
  }
}
