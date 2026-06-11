# LicenseMeter

Find the Microsoft 365 licenses you pay for but nobody uses.

LicenseMeter is a multi-tenant micro-SaaS for IT and finance teams. It connects
to a Microsoft 365 tenant with read-only application permissions, joins
directory data, license assignments, sign-in activity and usage reports, and
puts a monthly price on every wasted seat.

## What it detects

| Rule | Signal |
| --- | --- |
| Disabled account still licensed | `accountEnabled = false` with assigned licenses (offboarding leak) |
| Licensed but never active | No sign-in or workload activity, 30-day grace after account creation |
| Inactive for 90+ days | Last activity (sign-ins + Exchange/OneDrive/SharePoint/Teams) older than 90 days |
| Unassigned paid seats | `prepaidUnits.enabled` minus `consumedUnits` per SKU (shelfware) |
| Copilot seat unused | Copilot license with no Copilot activity in 60 days |
| Licensed guest account | `userType = Guest` holding paid licenses |

Every finding carries a monthly cost from an editable per-tenant price book
(prefilled with list-price estimates — there is no Microsoft API for tenant
pricing), a CSV export for finance, and a generated PowerShell remediation
script for IT. LicenseMeter itself never writes to the tenant.

## Graceful degradation

Detection adapts to what the customer tenant allows:

- No Entra ID P1/P2: `signInActivity` is unavailable; inactivity detection
  falls back to per-workload usage reports.
- Concealed report names (Microsoft default since 2021): usage-based findings
  become aggregate counts; directory-based findings (disabled accounts,
  shelfware, guests) keep working per user. The settings page explains how to
  enable identifiable names.

## Stack

- Next.js 15 (App Router) + Tailwind CSS 4, deployable on Vercel
- MSAL auth-code flow with PKCE for multi-tenant Entra sign-in
  (`/organizations`), jose-signed session cookies
- Drizzle ORM — Postgres in production, embedded PGlite for local dev/demo
- MSAL (client credentials) for app-only Graph access per customer tenant
- Vitest unit tests for the waste engine, signal joining, and CSV parsing

## Local development

```bash
npm install
npm run db:push        # creates the embedded PGlite database
npm run dev
```

Open http://localhost:3000 and click "Explore the demo workspace" — demo mode
(`DEMO_MODE=true` in `.env`) seeds a deterministic fixture tenant with ~155
users and all six waste patterns, no Entra setup required.

```bash
npm run test           # vitest
npm run check          # eslint + tsc
```

## Connecting real tenants

See [SETUP.md](SETUP.md): create the two app registrations with
[scripts/setup-entra.ps1](scripts/setup-entra.ps1), fill `.env`, deploy, and
grant admin consent from the in-app Connect page.

## Architecture

```
Customer tenant (Entra ID + Graph)        Adobe Admin Console (planned)
        |  one-time admin consent                 |
        v  app-only token, read-only scopes       v
   Sync worker (nightly cron + manual) ----> Postgres (tenant-scoped)
        |                                         |
        v                                         v
   Signal join (P1 / concealment aware) ---> Waste engine (6 rules, EUR impact)
                                                  |
                                                  v
   Next.js dashboard  <--- OIDC sign-in --- IT admins + finance viewers
```

- One workspace per Entra tenant (`tid`), every table scoped by `tenant_id`.
- Membership is invite-based; signing in from the same tenant alone grants
  nothing. The admin who completes consent becomes the workspace owner.
- Sync runs are step-logged (`sync_runs.steps`); non-critical steps degrade to
  warnings, and a partial unique index guarantees one running sync per tenant.

## Roadmap

Shipped since v1: Adobe connector (beta, offboarding-leak detection), trend
charts, MSP multi-workspace, per-workspace activity log, weekly digest
(activates with a Resend key), ops alerting webhook, health endpoint.

Open:

- Stripe billing and seat-band entitlements
- Opt-in write remediation as a separate consent step (deliberately excluded
  while the product promise is strictly read-only)
