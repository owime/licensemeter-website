import type { MetadataRoute } from "next";

import { siteUrl } from "~/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/pricing", "/security", "/faq"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
