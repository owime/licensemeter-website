import type { MetadataRoute } from "next";

import { siteUrl } from "~/env";
import { CONNECTOR_GUIDES } from "~/lib/connectorGuides";

/** Legal pages: indexable but low priority, they rarely change. */
const LOW_PRIORITY = new Set(["/impressum", "/privacy", "/dpa"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    "",
    "/pricing",
    "/msp",
    "/security",
    "/faq",
    "/connectors",
    ...CONNECTOR_GUIDES.map((g) => `/connectors/${g.slug}`),
    "/impressum",
    "/privacy",
    "/dpa",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : LOW_PRIORITY.has(path) ? 0.3 : 0.7,
  }));
}
