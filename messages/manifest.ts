/**
 * One entry per namespace file under messages/en/ and messages/no/. Both
 * locales must have a matching file for every entry here — next-intl throws
 * at runtime on a missing key, not a missing namespace file.
 */
export const MESSAGE_NAMESPACES = [
  "common",
  "connectErrors",
  "home",
  "connectors",
  "msp",
  "roi",
  "faq",
  "security",
  "trustCenter",
  "dpa",
  "sampleReport",
  "waste",
  "compare",
  "privacy",
  "terms",
  "cookies",
  "impressum",
  "status",
  "support",
  "dashboardHome",
  "licenses",
  "findings",
  "aiCosts",
  "portfolio",
  "connectorsDash",
  "settings",
  "renewals",
  "users",
  "account",
  "dashLayout",
  "tour",
  "connect",
] as const;
