# GA pass: Beta labels out, em dashes out, full product review (2026-06-12/13)

Goal: (1) remove every Beta/beta label so all connectors present as GA,
(2) remove all em dashes from texts and rewrite them warm and human,
(3) full review of every feature, page, button, link and text with a
prioritized fix/improve list as the deliverable.

## Plan

- [x] 1. Beta removal (19 hits): pills, licenses headers, landing strip tags,
       footer, msp, SITE_DEFINITION, runSync comments, README
- [x] 2. Em dash removal: 349 em dashes + 2 en dashes across ~120 files via
       4 parallel rewrite agents with disjoint file sets; tests in lockstep
- [x] 3. Gates: npm run check, npm test (179), npm run build all green;
       zero "beta" and zero em/en dash greps repo-wide
- [x] 4. Review fan-out: marketing agent, dashboard agent, server/API agent,
       live Playwright click-through, prod link health (20 routes 200),
       prod schema check (tenants.monthly_report present)
- [x] 5. Follow-up fixes from review, same mandate: four pre-GA copy spots
       (pricing early-access note, landing capture, welcome email footer,
       Datenschutz 4a) reworded to billing-not-started honesty (d7cfd44)
- [x] 6. Findings list compiled and delivered in chat
- [x] 7. "Fix all of it": 5 parallel agents (auth/security, server-actions,
       dash-pages, workspace-components, marketing/SEO/ROI) fixed every
       review item except the founder-only legal placeholders. Gates green:
       lint clean, 188 tests (was 179), production build, live smoke test
       (demo member guard, 404, ROI over-cap, signin returnTo, all dash
       pages 200, zero dash/beta). Local commit pending.

## Fixes applied (all P0/P1 + P2 from the review)

P0: prod sign-out cookie deletion now carries Secure/path via centralized
expiredSessionCookie/expiredOAuthCookie helpers (session was surviving
sign-out behind __Host-); demo workspace member actions
(addMember/removeMember/resendInvite) server-guarded against isDemo +
hidden in the settings UI (demo was brickable).
P1: owner-demotion via re-invite closed (claimed members cannot be
role-overwritten); trend chart now newest-90 desc+reverse (was frozen on
oldest 90); trial workspaces show connect-first notes instead of dead
connector forms; viewer cannot re-upload CSV / re-scan trial data;
updatePrice uses strict parsePriceValue (German thousands no longer
silently mangled); ROI over-cap shows talk-to-us above 2.500 seats;
welcome email retries on resubmit; auth CTAs route through
signin?returnTo so anonymous visitors no longer bounce silently;
Datenschutz (user) + security page Resend/connector data accuracy.
P2: branded /not-found; armed-confirm + error surfacing on connector
disconnects; DangerZone single-button arming keeps focus; MobileNav
focus trap + scroll lock + focus restore; ConnectPoller gives up after
~3min; 44px touch targets on findings checkboxes/chips; fmtDateTime in
sync/activity logs; provider-aware rule labels on the user page (RuleBadge
deleted); scope=col on table headers; "All active" wording; cron secret
constant-time compare; remediation strips CR/LF from titles; invite rate
limit; import status punctuation; sitemap +impressum/datenschutz; llms.txt
+connectors; OG image lineup; marketing skip link; FAQ publisher-verify
honesty; CONNECTOR_SCOPES.length not "five"; pricing annual computed.

## Review

- AC1 PASS: zero user-visible "beta" anywhere (src, docs, README, SETUP).
- AC2 PASS: zero em/en dashes in src/, docs/, README, SETUP, scripts,
  .github; copy rewritten as sentences, not hyphen swaps; the one
  functional em dash (parseMembers NO_DATE, parses pasted admin tables)
  kept as — escape.
- AC3 PASS: lint, tsc, 179/179 tests, production build green;
  SITE_DEFINITION single-sourced (hero = JSON-LD = llms.txt).
- AC4 PASS: every marketing route, dash route, API route, email template,
  PDF, and connector guide reviewed by dedicated agents plus a live
  click-through; prioritized findings delivered (top items: demo workspace
  can be bricked via ungated member actions; prod sign-out cookie deletion
  rejected by browsers (__Host- without Secure); Impressum/Datenschutz
  legal placeholders).
- AC5 OVERTAKEN: a concurrent session committed and pushed the GA pass as
  85af351 mid-session; my follow-up copy fixes are local commit d7cfd44,
  push pending user go-ahead.
- Environment note: dev server died during the QA click-through and
  corrupted .pglite; rebuilt (rm -rf .pglite, mkdir -p .pglite/data,
  db:push), demo reseeded and verified.
