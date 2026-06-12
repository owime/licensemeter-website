import type { MetadataRoute } from "next";

import { siteUrl } from "~/env";

/*
 * AI answer-engine crawlers get an explicit rule with the same policy as the
 * wildcard: marketing pages open (they drive citations in ChatGPT, Perplexity
 * and Gemini answers), the app and API off-limits. The explicit entries
 * document that intent so a later wildcard edit cannot silently block them.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/app", "/api"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
