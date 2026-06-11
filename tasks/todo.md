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

- [ ] 1. Plan + baseline commit (this file, git init)
- [ ] 2. DB schema + env config; Drizzle with PGlite (dev) / postgres-js (prod)
- [ ] 3. SKU catalog, GraphClient interface, MSAL app-only client, demo client, CSV parser
- [ ] 4. Waste rules engine (6 rules) + remediation generator + vitest unit tests
- [ ] 5. Auth.js multi-tenant Entra sign-in, demo provider, RBAC, admin-consent flow,
       sync pipeline, cron route
- [ ] 6. Dashboard UI on App Router: landing, overview, findings, licenses, settings, connect
- [ ] 7. Quality gates: lint + typecheck, unit tests, Playwright demo walkthrough
- [ ] 8. Docs: README, SETUP.md, scripts/setup-entra.ps1, .env.example, vercel.json
- [ ] 9. Independent code review (separate agent) against acceptance criteria; fix findings
- [ ] 10. Final commit, review section below, handoff summary

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

(filled in at the end)
