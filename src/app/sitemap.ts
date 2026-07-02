import type { MetadataRoute } from "next";

import { siteUrl } from "~/env";
import { WASTE_EXPLAINERS } from "~/app/(marketing)/waste/content";
import { CONNECTOR_GUIDES } from "~/lib/connectorGuides";

/** Legal pages: indexable but low priority, they rarely change. */
const LOW_PRIORITY = new Set(["/impressum", "/privacy", "/dpa", "/de/dpa"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    "",
    "/pricing",
    "/msp",
    "/roi",
    "/sample-report",
    "/compare/powershell-audit",
    "/compare/m365-admin-center",
    "/compare/excel-license-tracking",
    "/waste",
    ...WASTE_EXPLAINERS.map((e) => `/waste/${e.slug}`),
    "/security",
    "/de/security",
    "/trust-center",
    "/de/trust-center",
    "/faq",
    "/connectors",
    ...CONNECTOR_GUIDES.map((g) => `/connectors/${g.slug}`),
    "/status",
    "/impressum",
    "/privacy",
    "/dpa",
    "/de/dpa",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : LOW_PRIORITY.has(path) ? 0.3 : 0.7,
  }));
}
