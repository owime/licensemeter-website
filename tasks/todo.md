# Conversion + Retention Sprint (2026-06-12)

Goal: ship the conversion work (hero leak story, /msp page, aligned demo figures,
price-book credibility) and the retention work (delta digest, all-clear email,
offboarding-leak alerts, renewal-window framing). Stripe checkout is excluded
(no keys yet); publisher verification / secret rotation / legal are founder tasks.

## Plan

- [x] 1. Schema: tenants.renewalDate (date, null) + tenants.leakAlerts (bool, default true); db:push locally
- [x] 2. Agent A (marketing): hero rewrite around offboarding-leak story; /msp page + nav/sitemap;
       single source for demo-derived figures (landing card + pricing € 34.000 claim)
- [x] 3. Agent B (dashboard): list-price estimate labeling + price-book prompt on overview;
       licenses CSV bulk import/export; settings renewal date + leak-alerts toggle; overview renewal card
- [x] 4. Agent C (server): delta digest (new/resolved last 7d) + all-clear variant + renewal line;
       leak alert email on sync for newly inserted leak-rule findings
- [x] 5. Integration: npm run check + vitest green; Playwright walkthrough (landing, /msp, pricing,
       demo overview/licenses/settings)
- [x] 6. Independent code review (feature-dev:code-reviewer) on the full diff; fix findings
- [x] 7. Commit; apply additive prod migration via Supabase; push; CI green; verify live site
- [x] 8. Review section below + memory update + remaining-roadmap summary

## Acceptance criteria

- AC1: Landing hero leads with the cross-vendor offboarding-leak story; SITE_DEFINITION remains
  single-sourced in src/lib/site.ts; marketing tree stays static (no cookies()/auth()).
- AC2: /msp exists with metadata + Breadcrumb JSON-LD, linked from marketing nav and sitemap;
  no invented prices (CTA = demo + talk-to-us).
- AC3: Landing ledger card and pricing annual-waste claim derive from one shared source
  (src/lib/demoFigures.ts) guarded by a test against the demo fixtures, or are explicitly
  labeled as the same illustrative example. No contradictory euro figures on the site.
- AC4: Demo overview shows "estimated at list prices" qualifier + a set-your-prices prompt
  while the tenant's price book has zero custom rows; both disappear once a price is customized.
- AC5: /app/licenses supports bulk price entry (CSV paste or upload: key,monthly price) with
  per-row validation feedback, and CSV export of the current book; works for M365 SKUs and
  connector keys (adobe:/zoom:/atlassian:/salesforce:).
- AC6: Settings persists renewalDate (clearable) and leakAlerts per workspace, admin/owner-gated,
  audit-logged. Overview shows a renewal card when renewalDate is within 90 days (days left,
  open findings count, monthly waste).
- AC7: Digest email leads with the 7-day delta (new findings + euro impact, resolved count);
  sends an all-clear variant when 0 open findings AND a successful sync in the last 8 days
  (instead of silently skipping); includes the renewal line when within 90 days; demo excluded.
- AC8: On sync, newly inserted findings from leak rules (disabled-in-Entra / orphaned connector
  seats, plus the M365 disabled-account rule) trigger one immediate email to owners/admins,
  gated by tenants.leakAlerts, demo excluded, no repeat alert for the same finding on later syncs.
- AC9: npm run check green; full vitest suite green (currently 56) plus new tests for delta
  computation, leak-rule filtering, and CSV price parsing.
- AC10: Committed and pushed with prod schema migration applied first; CI green; live site
  spot-checked (/, /msp, /pricing).

## Review

All acceptance criteria verified (AC1-AC10). Shipped as d2e32b2; prod migration
tenant_renewal_date_and_leak_alerts applied before deploy; CI green; live checks:
/msp 200, new hero on landing, € 2.844,86 consistent across landing, pricing and
the production demo tenant overview.

- True demo figures derived and guarded: € 2.844,86/mo waste (was € 1.833,90 stale on
  landing), about € 34.000/yr — demoFigures.test.ts recomputes from fixtures through the
  full rules pipeline, so marketing can never drift from the demo again.
- Playwright end-to-end: hero + ledger card render from demoFigures; /msp static and
  linked; price import "Applied 2 prices. Skipped 1 unknown key" with German and dot
  decimals; qualifier + accuracy card disappear after import; waste recomputed
  2.844,86 -> 2.532,90 after custom prices; renewal card "Renewal in 50 days" with
  UTC-pinned math; settings save announces via aria-live; zero console errors.
- Independent review found 1 P0 (renewal math parsed date string in local TZ — fixed by
  extracting daysUntilDate, UTC-pinned, shared with the digest) and 3 applicable P1s
  (all-clear gate now accepts partial syncs + isNotNull guards; email subjects scrubbed
  of CR/LF). One P1 was a false positive (blank-line CSV case already covered by a
  passing test).
- 90/90 vitest, lint + tsc clean, production build green (/msp prerendered).
- Excluded from this sprint by dependency: Stripe checkout (no keys), publisher
  verification, secret rotation, legal placeholders (founder tasks).
