# LicenseMeter MVP — Build Plan

Goal: working v1 of LicenseMeter — a multi-tenant micro-SaaS that shows organizations
their wasted Microsoft 365 licenses with monthly cost impact. Read-only Graph access,
demo mode for verification without a live tenant.

## Scope decisions (from viability review, 2026-06-11)

- Read-only v1: no write Graph scopes; generate PowerShell remediation scripts instead.
- Two app registrations: delegated sign-in app + app-only connector app (admin consent).
- Detection degrades gracefully per tenant: no Entra P1 -> usage-report signals;
  concealed report names -> aggregate findings without user identities.
- Editable per-tenant price book prefilled with approximate list prices (no price API).
- Deferred (documented, not built): Stripe billing, email digest sending, Adobe
  connector, write remediation, MSP multi-tenant view, trends charts.

## Plan

- [x] 1. Plan + baseline commit (this file, git init)
- [x] 2. DB schema + env config; Drizzle with PGlite (dev) / postgres-js (prod)
- [x] 3. SKU catalog, GraphClient interface, MSAL app-only client, demo client, CSV parser
- [x] 4. Waste rules engine (6 rules) + remediation generator + vitest unit tests
- [x] 5. Auth.js multi-tenant Entra sign-in, demo provider, RBAC, admin-consent flow,
       sync pipeline, cron route
- [x] 6. Dashboard UI on App Router: landing, overview, findings, licenses, settings, connect
- [x] 7. Quality gates: lint + typecheck, unit tests, Playwright demo walkthrough
- [x] 8. Docs: README, SETUP.md, scripts/setup-entra.ps1, .env.example, vercel.json
- [x] 9. Independent code review (separate agent) against acceptance criteria; fix findings
- [x] 10. Final commit, review section below, handoff summary

## Acceptance criteria

- AC1: `npm run check` (next lint + tsc --noEmit) passes clean.
- AC2: `vitest run` passes; tests cover all 6 waste rules (including impact math),
  concealed/no-P1 degradation paths, and CSV parser edge cases (quoted fields, commas).
- AC3: With DEMO_MODE=true, a user can enter the demo workspace from the landing page
  and see: total monthly spend, total monthly waste, and a per-SKU table with
  purchased/assigned/available counts and monthly cost in EUR.
- AC4: Findings page lists demo findings across all 6 rules with per-finding monthly
  impact; a finding can be acknowledged; remediation PowerShell is viewable and
  copyable; findings CSV export downloads.
- AC5: Price book is editable; changing a price and re-running analysis updates impact.
- AC6: Real-tenant onboarding implemented code-complete: admin-consent redirect with
  state nonce, callback validates state + binds tenant + creates owner membership +
  triggers first sync. (Cannot be E2E-verified without a live tenant; verified by
  review + types + manual trace.)
- AC7: Sync pipeline tolerates per-step failures (partial sync recorded per step) and
  handles tenants without P1 and with concealed report names.
- AC8: Cron route requires CRON_SECRET; every app query is scoped through the
  signed-in user's membership (no cross-tenant access).
- AC9: SETUP.md + setup-entra.ps1 allow connecting a real tenant without code changes;
  README describes the product; .env.example lists every variable; no secrets committed.
- AC10: Playwright walkthrough of the demo flow passes; separate code-reviewer agent
  review completed and confirmed issues addressed.

## Review

All acceptance criteria pass (2026-06-11).

Automated gates: eslint clean, tsc clean, 31/31 vitest tests, production build
succeeds. Playwright walkthrough of the demo verified: landing, demo sign-in,
overview (6,979.90 EUR spend / 2,407.90 EUR waste / 48 findings), per-rule
counts (8/6/12/5/14/3), acknowledge + reopen, rule filters, price edit
recalculation (Copilot 28.10 -> 30.00 moved the rule total from 393.40 to
420 EUR/mo), findings + licenses CSV exports, generated PowerShell remediation
script, cron route 401 without secret, settings capabilities/members/history.

Bug found during E2E and fixed: concurrent layout+page rendering raced two
demo syncs (duplicate-key failure). Fixed with a partial unique index
(one running sync per tenant), upsert+prune persistence instead of
delete+insert, and a per-process seed mutex.

Independent code review (separate agent): no auth bypass or cross-tenant leak
found. Confirmed findings fixed:
- CRON_SECRET and APP_BASE_URL now build-time-required on Vercel deploys
- Consent callback consumes the state nonce only after validation passes
- Demo provider is registered only when DEMO_MODE=true
- CSV exports guard against spreadsheet formula injection
- Empty Graph responses no longer prune the stored inventory
- activitySignal persisted on the tenant so price-edit re-analysis matches sync
- PowerShell remediation escapes single quotes in UPNs

Known limitations (documented in README roadmap): no billing, no email digest,
Adobe connector not built, id_token accepted via TLS-direct token endpoint
without local JWKS verification (standard confidential-client pattern; JWKS
verification is a hardening follow-up), findings diff is row-at-a-time (fine
at MVP scale).

## Enterprise-readiness pass (2026-06-11, after design review)

Design review (ui-design-expert + saas-ceo-reviewer agents + axe scan) led to:
- Marketing shell with shared header/footer; new public pages: /security
  (CISO-targeted, scopes/subprocessors/retention/DPA), /pricing (flat tiers
  79/199/499 with ROI anchor), /faq (consent objections + FAQPage JSON-LD),
  /impressum and /datenschutz (German legal scaffolds with [placeholders]).
- Funnel reframed: primary CTA "Run a free waste scan", demo secondary,
  security overview linked from trust strip, connect page, and footer.
- Accessibility: 94 serious axe violations -> 0 across all 13 page/viewport
  combinations (rust-text/gold/ink-faint/sidebar-soft token fixes, global
  focus-visible ring, landmark and select-name fixes).
- Design system: shared Button/Pill components (3 button tiers, 2 pill tiers),
  status pills in findings, consistent spacing rhythm, locale-consistent
  number grouping, neutral utilization bars (rust reserved for money),
  voice-consistent empty states, "Set a price" moved from rust to gold.
- Responsive: ink top bar + drawer below lg, stacked ledger-card variants of
  all three data tables below md, landing ledger card wraps cleanly at 390px.
- SEO: metadataBase + OpenGraph/Twitter tags, generated OG image, robots.txt,
  sitemap.xml.

Still manual before launch: publisher verification, real legal/contact
details in the [placeholder] spots (impressum, datenschutz, founder bio,
support email), DPA document, production deploy.

---

# Landing page review + improvements (2026-06-11, post-launch pass)

Inputs: saas-ceo-reviewer + ui-design-expert agent reviews of the live site
(www.licensemeter.com) and source. Prior constraint honored: ledger aesthetic
locked, tighten only. Bio facts verified against ugurkoc.de + GitHub API.

## Plan

- [x] P0-1 Founder bio: replace bracketed placeholder with verified facts
      (Microsoft MVP for Intune and Security Copilot, per ugurkoc.de; open-source
      tools IntuneAssignmentChecker / IntuneBrew / DeviceOffboardingManager)
- [x] P0-2 Replace support@your-domain.example with support@licensemeter.com
      sitewide (layout + pricing + security + faq + datenschutz + impressum)
- [x] P0-3 Add final CTA band before footer (reuse SignInButtons)
- [x] P0-4 Fix dead `hidden sm:inline-flex` on header CTA (cascade collision
      with buttonClass inline-flex) via wrapper span
- [x] P1-1 Pricing teaser strip on landing (79/199/499, link to /pricing)
- [x] P1-2 Subhead rewrite leading with the free read-only scan
- [x] P1-3 Hero balance: self-center card, 1.35fr column ratio, lg:gap-12
- [x] P1-4 Headline step-down at lg (text-5xl) back up at xl (text-6xl)
- [x] P1-5 Nav/footer link tap targets (py-3 -my-3 nav, py-1 -my-1 footer)
- [x] P1-6 "Six waste rules" section header on How it works (h2; steps to h3)
- [x] P2-1 Mobile CTA stack full-width (SignInButtons w-full sm:w-auto)
- [x] P2-2 Buttons min-h-11 (44px tap target, equal hero button heights)
- [x] P2-3 Section rhythm: even pt-16 cadence, final section pb-24
- [x] P2-4 Trust-row separators as li after:content so no line starts with /
- [x] P2-5 Em dash in step 02; dynamic month in ledger card header
- [x] P2-6 Footer blurb mentions Adobe connector beta (consistency w/ /security)

Deliberately skipped: "recoverable"->"identified" (would diverge from /pricing
copy); attributing ledger card to demo tenant (card shows EUR 1.833,90/mo, live
demo shows EUR 2.407,90/mo - would be a false specific); extra hero credibility
line (founder card + CTA band carry it without hero clutter).

## Acceptance criteria

1. grep finds no "your-domain.example" and no "[One line" in src/
2. Bio contains only facts verifiable on ugurkoc.de / github.com/ugurkocde
3. Header "Free waste scan" CTA computed display:none below 640px, visible above
4. Landing shows pricing teaser matching /pricing numbers and a closing CTA band
5. npm run check passes; all vitest tests pass
6. Playwright at 1440/1024/390/320: no horizontal overflow, hero card vertically
   centered against text column, CTAs full-width at 390, no separator at a line
   start in the trust row
7. Independent code-reviewer agent reports no P0/P1 findings

## Review (2026-06-11, end of pass)

All plan items implemented; shipped in commit d2b4248 (committed by the
concurrent session working in this repo) plus a follow-up commit with two
code-review fixes.

- Acceptance criteria 1-6: verified (grep clean; bio facts checked against
  ugurkoc.de and the GitHub API; Playwright at 320/390/700/1024/1440 confirmed
  CTA visibility toggle at sm, 44px tap targets, full-width mobile CTAs,
  centered hero card, no horizontal overflow; npm run check + 36/36 vitest).
- Acceptance criterion 7: independent code review (feature-dev:code-reviewer)
  passed the commit with two P1s, both fixed in the follow-up commit:
  explicit `export const dynamic = "force-dynamic"` on the landing page (the
  current-month render depended implicitly on auth() in the layout) and
  footer column headings h2 -> h3 (document outline).
- Deliberately not done: "recoverable" -> "identified" wording, demo-tenant
  attribution on the ledger card (numbers would not match the live demo),
  extra hero credibility line. Impressum/Datenschutz legal [placeholders]
  remain - they need real legal data only the founder can supply.

---

# Brand mark + favicon set (2026-06-11, same session)

Missing entirely: no favicon.ico (metadata referenced a non-existent file,
tabs show default globe), no logo mark anywhere.

## Plan

- [x] Design mark in the locked ledger language (paper/ink/rust, geometric,
      legible at 16px); compare 2 candidates at real sizes before choosing
- [x] BrandMark React component; integrate marketing header + footer
- [x] src/app/icon.svg (SVG favicon, paper tile), src/app/favicon.ico
      (16+32 PNG-in-ICO via sharp + scripts/make-icons.mjs),
      src/app/apple-icon.png (180x180)
- [x] Remove manual metadata.icons from root layout (file conventions win)
- [x] Add mark to opengraph-image.tsx wordmark
- [x] Do NOT touch the dash layout (concurrent session is editing it)

## Acceptance criteria

1. /icon.svg, /favicon.ico, /apple-icon.png all return 200 with correct
   content types; head contains the link tags
2. Mark is recognizable at 16px on light and dark tab strips
3. Header/footer render the mark without layout shift; axe-clean (aria-hidden
   on decorative svg)
4. npm run check passes; code-reviewer pass on the diff

## Review (brand mark + favicon, end of pass)

All items done; shipped inside d24e4c5 (swept into the concurrent session's
feature-sprint commit) and pushed to production.

- Mark: "struck tally" - three ink bars, rust diagonal strike; chosen over a
  gauge after rendering both at 16/24/32/64 px (tally wins on distinctiveness,
  refined 3-bar variant wins legibility at 16px; candidates in /tmp/lm-mark).
- Assets: src/app/icon.svg (paper tile), favicon.ico (16+32 PNG-in-ICO via
  scripts/make-icons.mjs), apple-icon.png (180, padded for iOS rounding);
  manual metadata.icons removed in favor of file conventions.
- Stock T3 scaffold public/favicon.ico deleted - it conflicted with the app-
  dir favicon (Next 500 "conflicting public file and page file").
- Verified live on dev: all three endpoints 200 with correct content types,
  three link tags in head, header/footer/OG render the mark.
- Code review (separate agent): one P1 - sharp was only a transitive dep of
  Next; now pinned as devDependency ^0.34.5. ICO writer, a11y (aria-hidden +
  focusable=false), data-URI OG approach, and geometry consistency all passed.
- Lesson (mine): zsh aborts the whole command line on a failed glob - an
  early `ls public/ src/app/*.ico` silently never ran, which hid the existing
  scaffold favicon until Next's conflict error surfaced it.

---

# Dashboard sidebar review + fixes (2026-06-11, same session)

ui-design-expert review of live demo at 1440/1280/390 + short viewports.

## Plan

- [x] P0-1 aside overflow-y-auto (Sign out clipped at short heights, no scroll)
- [x] P0-2 globals.css focus override: include select (rust ring 3.33:1 on
      sidebar vs paper 17.18:1)
- [x] P1-1 /app/users/* keeps Findings nav item active
- [x] P1-2 aria-current="page" on active nav link
- [x] P1-3 drawer: Escape closes, aria-controls + id wiring
- [x] P1-4 sign-out tap targets min-h-11 (was 16px tall), + transition (P2-3)
- [x] P2-1 nav px-[18px] aligns text at 20px rail rhythm
- [x] P2-2 WorkspaceSwitcher select px-2 py-1 rounded-none
- [x] P2-4 active bg tint /40 -> /70
- [x] P2-5 BrandMark tone="dark" (paper bars + rust-bright strike, 5.46:1)
      in desktop sidebar + mobile top bar; burger hit area to 44px

## Acceptance criteria

1. Sign out reachable at 1280x480 with Portfolio item present
2. select focus ring is paper on sidebar; aria-current present; Escape closes
   drawer; sign-out hit boxes >= 44px tall
3. Mark visible on dark rail at 1440 and 390; geometry identical to light mark
4. npm run check + tests pass; code-reviewer pass on the diff

## Review (sidebar pass, end)

All plan items implemented and verified live (demo session, Playwright):
mark on both dark surfaces, aria-current (Findings stays active on
/app/users/*), aside scrolls at short heights with Sign out reachable,
burger 44x44 + aria-controls resolving in BOTH drawer states (drawer now
stays mounted with hidden={!open} - Tailwind preflight [hidden] wins over
.flex), Escape closes via document-level listener regardless of focus,
sign-out hit boxes 44px, select included in the paper focus-ring override,
nav text aligned at the 20px rail rhythm, active tint /70. Code review
(separate agent): 2 P1s found (aria-controls vs conditional render; header-
scoped Escape) - both fixed and re-verified. 42/42 tests, lint + tsc clean.
Latent note, no action: startsWith matching could double-match if sibling
routes ever share a prefix (e.g. /app/licenses-beta).

---

# Settings subpages: connectors as own pages (2026-06-12)

User request: move Adobe config off the settings page to /app/settings/adobe;
sidebar shows connector sub-items under Settings while inside the section -
one subpage per connector going forward. Also fix the remaining nav issue
(prefix matching) since it becomes load-bearing with subpages.

## Plan

- [ ] Boundary-safe nav matching (=== or startsWith(href + "/")) - closes the
      latent /app/licenses-beta double-match for good
- [ ] NavLinks: children support; sub-items render while in the section,
      indented, aria-current on the exact page only (parent OR child)
- [ ] Card extracted from settings page to ~/components/ui.tsx
- [ ] New /app/settings/adobe page: Adobe card content + queries moved there,
      h1 + Beta pill, same role gating (viewer sees status, admin configures)
- [ ] Settings page: Adobe card/queries/imports removed; slim "Connectors"
      directory card (Adobe row: status + Configure link)
- [ ] Mobile drawer inherits sub-items; child click closes drawer

## Acceptance criteria

1. /app/settings shows Connectors card; Adobe config lives ONLY on
   /app/settings/adobe (works for demo, connected, admin, viewer states)
2. Sidebar: "Adobe connector" child visible iff pathname is under
   /app/settings; child has aria-current on the subpage; Settings parent has
   aria-current only on /app/settings exactly
3. No nav item double-matches any existing route; /app/users/* still keeps
   Findings active
4. lint + tsc + 42 tests pass; Playwright verifies sidebar states on
   desktop + mobile drawer; code-reviewer pass

## Review (settings subpages, end)

All items done, verified live via Playwright demo session: Connectors card on
/app/settings (Adobe + Beta pill + status + role-aware link: View/Manage/
Configure); /app/settings/adobe carries the full connector config (demo state
rendered with 8 seats; admin form/disconnect; viewer status-only), breadcrumb
+ Beta pill + "what it detects" card; sidebar child "Adobe connector" appears
only inside /app/settings/*, aria-current on exactly one link everywhere
(child on subpage, parent on /app/settings, Findings on /app/users/*);
mobile drawer shows the child and closes on navigate. Boundary-safe
inSection() matching replaces raw startsWith (the last remaining flagged
issue); /app/users belongs to Findings via the `also` mechanism. Card
extracted to ui.tsx. Code review (separate agent): revalidation safe
(revalidatePath "/app" layout-level), no redirect staleness, no cycles; its
2 findings fixed: role-aware link label, adobeConn folded into Promise.all.
42/42 tests, lint + tsc clean.

---

# Zoom + Atlassian + Salesforce connectors (2026-06-12)

User: "lets add all 3" + logo question (answered: text names yes, official
logos need permission - implement text treatment + trademark disclaimer).

## Plan

- [ ] Generic framework: saas_connections + saas_seats tables (provider
      column), SaasProvider/SaasSeat types, rules saas_disabled_in_entra /
      saas_orphaned / saas_inactive
- [ ] Drizzle migration 0005 (dev push + prod apply via Supabase MCP with
      RLS + licensemeter_app grants matching adobe tables)
- [ ] Clients: zoom (S2S OAuth, /users, type=Licensed, last_login_time),
      atlassian (org API key, admin /users, product_access + last_active),
      salesforce (client-credentials, SOQL User + Profile.UserLicense.Name,
      LastLoginDate; instanceUrl restricted to *.my.salesforce.com - SSRF)
- [ ] Pure mappers exported per client + vitest coverage; generic analyze
      with null-activity conservatism (no finding without a signal)
- [ ] runSync + runAnalysis wiring (per-provider steps, upsert+prune,
      price prefill <provider>:<product>, demo price defaults)
- [ ] Actions connectSaas/disconnectSaas (admin, validate-before-store,
      encrypted secret, audit connector_connected/_disconnected)
- [ ] Demo fixtures: distinct disabled leavers per provider (140 zoom,
      141 atlassian, 142 salesforce), inactive zoom/atlassian seats, orphans
- [ ] UI: lib/connectors spec (client-safe), SaasConnectForm, shared
      connector page + 3 subpages, NavLinks children x3, Connectors card
      rows x3
- [ ] Landing: "Microsoft 365 today. Adobe, Zoom, Atlassian and Salesforce
      in beta." line; footer trademark disclaimer; security stored-data line

## Acceptance criteria

1. Demo workspace (fresh seed) shows findings from all 3 new providers with
   priced impact; subpages render all states; nav shows 4 children
2. Rules appear in findings UI badges/filters without extra wiring
3. No SSRF: salesforce instanceUrl validated; all other hosts fixed
4. tsc + lint + vitest green (new tests for mappers + analyze)
5. Prod migration applied (additive) with RLS before any push
6. Code-reviewer pass; logos answered with safe treatment implemented

## Review (3 connectors, end)

All plan items shipped and verified live on the demo workspace: sync steps
zoomSeats:6 / atlassianSeats:5 / salesforceSeats:3, findings 51 -> 59 (the
exact 8 expected: 3 disabled-in-Entra leaks incl. the EUR 165 Salesforce
seat, 3 inactive, 2 orphans), badges App leak / App orphan / App idle render,
Connectors card 4 rows, sidebar children x4, subpages render demo state,
landing + footer + security copy updated with text-only names and the
trademark disclaimer. 54/54 tests (12 new), tsc + lint clean. Prod migration
saas_connectors applied via Supabase with RLS + app_all policies + grants
mirroring the adobe tables (additive; live code unaffected until deploy).
Framework improvement over the Adobe pattern: transient provider-API failure
analyzes stored seats instead of auto-resolving findings. Code review
(separate agent): no P0; P1 fixed (connect-time provider errors no longer
echoed to the browser - server log only); P2 addressed (failed-sync hint on
the connector page). Known follow-up: Adobe still auto-resolves findings on
transient API failure - port the stored-seat fallback to it.

---

# Frontend review fixes (2026-06-12)

Source: /frontend orchestrator review (marketing + dash code agents, Vercel
Web Interface Guidelines, live Playwright pass at 1440/375). User: "fix all
of it" - 1 P1, ~19 P2, ~25 P3. Constraint: ledger aesthetic locked, tighten
only. Four parallel agents with disjoint file ownership.

## Plan

Agent A - marketing surface (+ root layout, ui.tsx):
- [ ] P1 EmailCapture: persistent aria-live region (no unmount on success),
      focus handling, aria-invalid, autoComplete/spellCheck, min-h-11 input
- [ ] P2 lang="de" on datenschutz + impressum content
- [ ] P2 footer internal links -> Link (mailto stays <a>)
- [ ] P2 single German number convention on landing + pricing (incl. stale
      payback claim -> accurate EUR 34.000 from deterministic demo)
- [ ] P2 ui.tsx: cursor-pointer + touch-action on buttons; micro-button
      44px effective hit area without visual change
- [ ] P2 security subprocessors: + Resend row, DB naming aligned w/ legal
- [ ] P3 SignInButtons disabled-state semantics; curly quotes (security);
      viewport themeColor; title.template + marketing title reconcile;
      FAQ anchors + heading order + connector-credentials entry (JSON-LD
      synced); text-balance on h1/h2s; hero "D90" jargon -> plain language

Agent B1 - dash pages (findings, home, users, portfolio):
- [ ] P2 "across 6 rules" -> ALL_RULES.length
- [ ] P2 rules.ts threshold-neutral inactivity labels
- [ ] P2 findings: bulk-ack feedback (aria-live), select-all, disable at 0
- [ ] P2 portfolio mobile cards + per-row aria-labels
- [ ] P2 (dash)/not-found.tsx with shell
- [ ] P3 chips aria-current + hide zero-count rules; provider-aware leak
      chips if derivable from existing finding fields
- [ ] P3 findings pagination (searchParams, preserves filter)
- [ ] P3 users/[id] fmtDate + UPN break-all; TrendChart date fmt + font
- [ ] P3 (dash) loading.tsx + error.tsx; metadata titles (owned pages)

Agent B2 - settings + shell components:
- [ ] P2 settings action results rendered (invite/remove/resend) aria-live
- [ ] P2 member remove armed-confirm; invite input aria-label
- [ ] P2 MobileNav: scrollable drawer + WorkspaceSwitcher in drawer
- [ ] P2 WorkspaceSwitcher/CurrencySelect: no focus-loss disable, no
      per-keypress submit
- [ ] P3 connector forms: aria-live statuses, spellcheck/autocap/autocorrect
      off, new-password on secrets, orgRef inputMode="url" (NOT type=url),
      placeholders as format examples
- [ ] P3 overflow fixes (actor email, sync steps, orgRef); motion-safe
      pulse; breadcrumb semantics -> #connectors; DangerZone h2; skip link;
      metadata titles (owned pages)

Agent C - server/data + licenses:
- [ ] P2 graphUserId on Adobe/SaaS disabled-in-Entra findings (orphans stay
      null); tests updated
- [ ] P2 licenses page: editable price sections for zoom/atlassian/
      salesforce products (Adobe pattern)
- [ ] P3 PriceRow aria-label display name; salesforce orgRef server-side
      normalization; licenses metadata title

## Acceptance criteria

1. npm run check green; vitest green (54+, updated where contracts changed)
2. Demo: user with an Adobe/SaaS leak shows that finding on /app/users/[id]
   (after demo re-sync); finding links to the user page
3. Licenses page has editable price rows for all connected SaaS providers
4. Overview rule count computed, matches ALL_RULES.length
5. One (German) number convention across landing + pricing money figures
6. EmailCapture: success/error announced via persistent live region, no
   form unmount, no focus loss (code-verified)
7. Mobile: drawer scrollable at short viewports; portfolio usable at 375px;
   findings select-all + zero-selection guard work
8. Distinct document titles per app page
9. Ledger aesthetic untouched (no color/font/layout redesign)
10. Independent code-reviewer agent: no P0/P1 regressions vs these criteria

Deliberate decisions: German number convention sitewide (product is
EU/German-market; app + hero ledger already German). Salesforce orgRef stays
text + inputMode="url" (type="url" rejects scheme-less paste). Payback claim
pinned to deterministic demo (EUR 34.000/yr). Orphan findings keep
graphUserId null (no directory user exists).

## Review (2026-06-12, end of pass)

All ~45 findings implemented across 46 modified + 7 new files
(+~900/-300 lines). Four parallel agents with disjoint ownership; one
flagged boundary crossing accepted (2-line graphId pass-through in
runSync.ts identity mapping - required for the fix to reach analyzers).

Gates: eslint clean, tsc clean, 56/56 vitest (suite grew 54 -> 56 with
salesforce-normalization tests; graphUserId assertions strengthened).

Orchestrator-found bug during verification (would have shipped broken):
diffFindings updated title/detail/impact but not graphUserId on existing
findings, so the user-page linkage fix only applied to brand-new findings.
One-line fix in runSync.ts set clause; backfills every tenant on next sync.

Live Playwright verification (fresh PGlite + reseeded demo): user page
shows the Adobe leak for a disabled user with provider chip; overview
"across 13 rules" computed; provider-aware chips (Salesforce/Adobe leak);
licenses page has editable Zoom/Atlassian/Salesforce sections with
display-name aria-labels; findings select-all -> "50 selected" + enabled
button, disabled at zero, "Showing 1-50 of 59" + ?page=2 link, zero-count
chips hidden; breadcrumb nav with #connectors anchor; skip link first
focusable; (dash) loading skeleton streams; mobile drawer max-h 500px/
overflow auto/overscroll contain at 560px viewport; email capture has
persistent polite live region + autocomplete + spellcheck off + 44px
input before any submit; pricing all-German figures (EUR 2.388 / 34.000);
per-page document titles. Console clean post-rebuild.

Independent code review (feature-dev:code-reviewer): no P0; all 10
acceptance criteria pass. Its 3 P1s fixed same pass and re-gated:
select-all indeterminate state (ref + effect), InviteForm email survival
keyed remount (defaultValue applies once per mount), armed-confirm sr-only
live region announcing "Press again to confirm removal." Its P2 about
:443 rejection was a false premise (URL.origin drops default ports -
verified); recount-after-revalidate timing accepted as cosmetic.

Incident note: PGlite wedged (WASM Aborted on every query) after debug
instances opened the dataDir between unclean dev-server kills. Recovered
by rm -rf .pglite + mkdir -p .pglite/data (PGlite mkdir is not recursive)
+ db:push + demo reseed. Lesson recorded: never open a second PGlite on
the dev dataDir, even with the server stopped mid-WAL.

Not committed - working tree left for the user to review.
