import type { WasteRuleId } from "~/server/types";
import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";

/**
 * One indexable explainer per Microsoft 365 waste-detection rule, rendered at
 * /waste/<slug>. Every claim is grounded in the codebase: the signal column of
 * the README rules table, the thresholds exported from
 * ~/server/waste/engine.ts (30-day never-active grace, 90-day default
 * inactivity window, 60-day Copilot window, the shelfware exemptions), the
 * graceful-degradation section of the README and the read-only scopes in
 * ~/lib/scopes.ts. Euro figures come exclusively from DEMO_FIGURES, which
 * demoFigures.test.ts recomputes from the demo fixtures and the rules engine.
 * PowerShell snippets were verified against Microsoft Learn (Get-MgUser
 * advanced queries, the signInActivity filter, Get-MgSubscribedSku and the
 * beta getMicrosoft365CopilotUsageUserDetail report).
 *
 * Display copy (name, headings, paragraphs, notes) lives in the "waste"
 * message namespace (messages/en/waste.json, messages/no/waste.json), keyed
 * by slug under "explainers.<slug>". This file only owns the stable
 * structural data (slugs, rule ids, PowerShell snippets) plus the
 * `buildWasteExplainers` function that assembles the fully localized array
 * from a translation function. Slugs are used for routing and must never be
 * translated or reordered in a way that changes their values.
 */

export type WasteExplainer = {
  slug: string;
  rule: WasteRuleId;
  /** Short name used in index cards, breadcrumbs and cross-links. */
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  /** One-line teaser for the /waste index cards. */
  summary: string;
  what: { heading: string; paragraphs: string[] };
  manual: {
    heading: string;
    intro: string;
    snippet: string;
    notes: string[];
  };
  automatic: { heading: string; paragraphs: string[] };
  cost: { heading: string; paragraphs: string[] };
};

/** Translation function shape compatible with next-intl's `t`. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Stable routing metadata: slug values must never change or be translated. */
const WASTE_SLUGS: { slug: string; rule: WasteRuleId }[] = [
  { slug: "disabled-accounts-still-licensed", rule: "disabled_account_with_license" },
  { slug: "licensed-but-never-active", rule: "never_active" },
  { slug: "inactive-licensed-users", rule: "inactive_90d" },
  { slug: "unassigned-microsoft-365-licenses", rule: "shelfware" },
  { slug: "unused-copilot-licenses", rule: "copilot_unused" },
  { slug: "licensed-guest-accounts", rule: "licensed_guest" },
];

/** PowerShell snippets are code, not prose: kept in English regardless of locale. */
const SNIPPETS: Record<string, string> = {
  "disabled-accounts-still-licensed": `Connect-MgGraph -Scopes 'User.Read.All'
$p = @{
  Filter           = 'accountEnabled eq false and assignedLicenses/$count ne 0'
  ConsistencyLevel = 'eventual'
  CountVariable    = 'c'
  All              = $true
}
Get-MgUser @p | Select-Object DisplayName, UserPrincipalName`,
  "licensed-but-never-active": `Connect-MgGraph -Scopes 'User.Read.All', 'AuditLog.Read.All'
Get-MgUser -All -Property 'displayName,userPrincipalName,createdDateTime,signInActivity,assignedLicenses' |
  Where-Object {
    $_.AssignedLicenses.Count -gt 0 -and
    -not $_.SignInActivity.LastSignInDateTime
  } | Select-Object DisplayName, UserPrincipalName, CreatedDateTime`,
  "inactive-licensed-users": `Connect-MgGraph -Scopes 'User.Read.All', 'AuditLog.Read.All'
$cutoff = (Get-Date).AddDays(-90).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
Get-MgUser -All -Filter "signInActivity/lastSignInDateTime le $cutoff" -Property 'displayName,userPrincipalName,signInActivity' |
  Select-Object DisplayName, UserPrincipalName`,
  "unassigned-microsoft-365-licenses": `Connect-MgGraph -Scopes 'Organization.Read.All'
Get-MgSubscribedSku | Select-Object SkuPartNumber,
  @{ n = 'Purchased'; e = { $_.PrepaidUnits.Enabled } },
  ConsumedUnits,
  @{ n = 'Unassigned'; e = { $_.PrepaidUnits.Enabled - $_.ConsumedUnits } }`,
  "unused-copilot-licenses": `Connect-MgGraph -Scopes 'Reports.Read.All'
$uri = 'https://graph.microsoft.com/beta/reports/getMicrosoft365CopilotUsageUserDetail(period=''D90'')?$format=text/csv'
Invoke-MgGraphRequest -Method GET -Uri $uri -OutputFilePath copilot-usage.csv`,
  "licensed-guest-accounts": `Connect-MgGraph -Scopes 'User.Read.All'
$p = @{
  Filter           = 'userType eq ''Guest'' and assignedLicenses/$count ne 0'
  ConsistencyLevel = 'eventual'
  CountVariable    = 'c'
  All              = $true
}
Get-MgUser @p | Select-Object DisplayName, UserPrincipalName, UserType`,
};

/** Kept for routing (sitemap.ts, generateStaticParams): slug + rule only. */
export const WASTE_EXPLAINERS: { slug: string; rule: WasteRuleId }[] = WASTE_SLUGS;

const costValues = {
  users: DEMO_FIGURES.users,
  leaverCount: DEMO_FIGURES.leaverCount,
  leaversEuros: demoEuros(DEMO_FIGURES.byCategory.leavers),
  idleEuros: demoEuros(DEMO_FIGURES.byCategory.idle),
  shelfwareEuros: demoEuros(DEMO_FIGURES.byCategory.shelfware),
  copilotUnusedEuros: demoEuros(DEMO_FIGURES.byCategory.copilotUnused),
  guestsEuros: demoEuros(DEMO_FIGURES.byCategory.guests),
};

/** Builds the fully localized explainer array from a translation function. */
export const buildWasteExplainers = (t: Translate): WasteExplainer[] =>
  WASTE_SLUGS.map(({ slug, rule }) => {
    const k = (key: string) => `explainers.${slug}.${key}`;
    return {
      slug,
      rule,
      name: t(k("name")),
      metaTitle: t(k("metaTitle")),
      metaDescription: t(k("metaDescription")),
      h1: t(k("h1")),
      intro: t(k("intro")),
      summary: t(k("summary")),
      what: {
        heading: t(k("what.heading")),
        paragraphs: [t(k("what.paragraph1")), t(k("what.paragraph2"))],
      },
      manual: {
        heading: t(k("manual.heading")),
        intro: t(k("manual.intro")),
        snippet: SNIPPETS[slug]!,
        notes: [t(k("manual.note1")), t(k("manual.note2"))],
      },
      automatic: {
        heading: t(k("automatic.heading")),
        paragraphs: [t(k("automatic.paragraph1")), t(k("automatic.paragraph2"))],
      },
      cost: {
        heading: t(k("cost.heading")),
        paragraphs: [
          t(k("cost.paragraph1")),
          t(k("cost.paragraph2"), costValues),
        ],
      },
    };
  });

export const wasteExplainer = (
  t: Translate,
  slug: string,
): WasteExplainer | undefined =>
  buildWasteExplainers(t).find((e) => e.slug === slug);
