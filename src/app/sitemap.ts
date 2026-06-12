import type { MetadataRoute } from "next";

import { siteUrl } from "~/env";
import { CONNECTOR_GUIDES } from "~/lib/connectorGuides";

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
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
