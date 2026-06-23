import "server-only";

import { sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  STATUS_PROVIDERS,
  indicatorToLevel,
  worstLevel,
  type StatusLevel,
  type StatusProvider,
} from "~/lib/statusProviders";

/**
 * Live data for /status. Own services come from a DB reachability probe (the
 * same `select 1` as /api/health); subprovider health is aggregated from each
 * vendor's public Statuspage feed. All probes are wrapped so a single failure
 * degrades one row rather than throwing the whole page.
 *
 * Caveat by design: this runs inside the same app it reports on, so it cannot
 * truthfully report a full app/Vercel outage (it would be down too). The Vercel
 * row partly covers that; a true independent monitor is a future addition.
 */

const REVALIDATE_SECONDS = 60;
const FETCH_TIMEOUT_MS = 5000;

export type ServiceStatus = {
  name: string;
  description: string;
  level: StatusLevel;
};

export type ProviderStatus = StatusProvider & {
  level: StatusLevel;
  description: string;
};

export type StatusOverview = {
  overall: StatusLevel;
  services: ServiceStatus[];
  providers: ProviderStatus[];
  checkedAt: string;
};

async function checkDatabase(): Promise<StatusLevel> {
  try {
    await db.execute(sql`select 1`);
    return "operational";
  } catch {
    return "outage";
  }
}

type StatuspagePayload = {
  status?: { indicator?: string; description?: string };
};

async function fetchProvider(
  provider: StatusProvider,
): Promise<ProviderStatus> {
  try {
    const res = await fetch(provider.statusApiUrl, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as StatuspagePayload;
    const indicator = data.status?.indicator ?? "";
    return {
      ...provider,
      level: indicatorToLevel(indicator),
      description: data.status?.description ?? "All Systems Operational",
    };
  } catch {
    return {
      ...provider,
      level: "unknown",
      description: "Could not reach status feed",
    };
  }
}

export async function getStatusOverview(): Promise<StatusOverview> {
  const [dbLevel, providers] = await Promise.all([
    checkDatabase(),
    Promise.all(STATUS_PROVIDERS.map(fetchProvider)),
  ]);

  const services: ServiceStatus[] = [
    {
      name: "Application and API",
      description: "Marketing site, dashboard and sync API",
      level: "operational",
    },
    {
      name: "Database",
      description: "License inventory and findings storage",
      level: dbLevel,
    },
  ];

  return {
    overall: worstLevel(services.map((s) => s.level)),
    services,
    providers,
    checkedAt: new Date().toISOString(),
  };
}
