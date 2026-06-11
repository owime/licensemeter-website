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

- [ ] P0-1 Founder bio: replace bracketed placeholder with verified facts
      (Microsoft MVP for Intune and Security Copilot, per ugurkoc.de; open-source
      tools IntuneAssignmentChecker / IntuneBrew / DeviceOffboardingManager)
- [ ] P0-2 Replace support@your-domain.example with support@licensemeter.com
      sitewide (layout + pricing + security + faq + datenschutz + impressum)
- [ ] P0-3 Add final CTA band before footer (reuse SignInButtons)
- [ ] P0-4 Fix dead `hidden sm:inline-flex` on header CTA (cascade collision
      with buttonClass inline-flex) via wrapper span
- [ ] P1-1 Pricing teaser strip on landing (79/199/499, link to /pricing)
- [ ] P1-2 Subhead rewrite leading with the free read-only scan
- [ ] P1-3 Hero balance: self-center card, 1.35fr column ratio, lg:gap-12
- [ ] P1-4 Headline step-down at lg (text-5xl) back up at xl (text-6xl)
- [ ] P1-5 Nav/footer link tap targets (py-3 -my-3 nav, py-1 -my-1 footer)
- [ ] P1-6 "Six waste rules" section header on How it works (h2; steps to h3)
- [ ] P2-1 Mobile CTA stack full-width (SignInButtons w-full sm:w-auto)
- [ ] P2-2 Buttons min-h-11 (44px tap target, equal hero button heights)
- [ ] P2-3 Section rhythm: even pt-16 cadence, final section pb-24
- [ ] P2-4 Trust-row separators as li after:content so no line starts with /
- [ ] P2-5 Em dash in step 02; dynamic month in ledger card header
- [ ] P2-6 Footer blurb mentions Adobe connector beta (consistency w/ /security)

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

- [ ] Design mark in the locked ledger language (paper/ink/rust, geometric,
      legible at 16px); compare 2 candidates at real sizes before choosing
- [ ] BrandMark React component; integrate marketing header + footer
- [ ] src/app/icon.svg (SVG favicon, paper tile), src/app/favicon.ico
      (16+32 PNG-in-ICO via sharp + scripts/make-icons.mjs),
      src/app/apple-icon.png (180x180)
- [ ] Remove manual metadata.icons from root layout (file conventions win)
- [ ] Add mark to opengraph-image.tsx wordmark
- [ ] Do NOT touch the dash layout (concurrent session is editing it)

## Acceptance criteria

1. /icon.svg, /favicon.ico, /apple-icon.png all return 200 with correct
   content types; head contains the link tags
2. Mark is recognizable at 16px on light and dark tab strips
3. Header/footer render the mark without layout shift; axe-clean (aria-hidden
   on decorative svg)
4. npm run check passes; code-reviewer pass on the diff
