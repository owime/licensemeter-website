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
