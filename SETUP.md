# LicenseMeter production setup

This guide takes you from a fresh clone to a deployment that real Microsoft
365 tenants can connect to.

## 1. Prerequisites

- An Entra tenant that owns the app registrations. Use a dedicated product
  tenant, not a customer tenant.
- For consent from customer tenants: publisher verification. Unverified
  multi-tenant apps are blocked from consent in most tenants. You need a
  Microsoft AI Cloud Partner Program account and a verified publisher domain
  matching the app. Start early. This gates everything.
  https://learn.microsoft.com/entra/identity-platform/publisher-verification-overview
- A Postgres database in the EU (e.g. Neon `eu-central-1` or Supabase
  Frankfurt).
- A Vercel project (or any Node 20+ host).

## 2. Create the app registrations

```powershell
# In the product tenant, as a user who can create applications
Install-Module Microsoft.Graph.Applications -Scope CurrentUser
./scripts/setup-entra.ps1 -BaseUrl "https://your-deployment.example"
```

The script creates:

- "LicenseMeter Sign-in": multi-tenant OIDC login app
  (redirect: `/api/auth/callback/microsoft-entra-id`), no Graph permissions.
- "LicenseMeter Connector": multi-tenant app-only connector
  (redirect: `/api/connect/callback`) with read-only application permissions:
  `User.Read.All`, `AuditLog.Read.All`, `Reports.Read.All`,
  `LicenseAssignment.Read.All`, `ReportSettings.Read.All`.

It prints the four env values. Secrets expire after 12 months; for production,
replace the connector secret with a certificate credential when convenient.

For local development, run it again with `-BaseUrl "http://localhost:3000"`
or add the localhost redirect URIs to the same apps.

## 3. Environment variables

Set these locally in `.env` and in Vercel (Production + Preview):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (EU region) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` | from the setup script |
| `CONNECTOR_CLIENT_ID` / `_SECRET` | from the setup script |
| `CRON_SECRET` | random string (16+ chars); Vercel Cron sends it as a Bearer token |
| `APP_BASE_URL` | public URL, e.g. `https://app.licensemeter.example` |

`CRON_SECRET` and `APP_BASE_URL` are validated at build time on Vercel. A
deploy without them fails instead of shipping a broken consent flow or an
unprotected cron route.
| `DEMO_MODE` | `"true"` to keep the public demo workspace, else `"false"` |

## 4. Database schema

```bash
DATABASE_URL="postgres://..." npm run db:push
```

## 5. Deploy

```bash
vercel deploy --prod
```

`vercel.json` schedules the nightly sync (`/api/cron/sync`, 03:00 UTC). Confirm
the cron job appears in the Vercel project settings and that `CRON_SECRET` is
set, otherwise the route answers 401.

## 6. Connect the first customer tenant

1. Sign in at the deployment with a work account from the customer tenant.
2. You land on `/app/connect`. Review the listed read-only scopes.
3. Click "Grant admin consent". A Global Administrator of that tenant
   completes the Microsoft dialog.
4. The callback binds the consenting workspace, makes the initiator the owner,
   and starts the first sync (licenses, users, usage reports, analysis).
5. Invite finance colleagues as viewers under Settings > Members. They sign in
   with Microsoft; access is invite-based, never tenant-wide.

## 7. Tenant-side notes

- Sign-in activity requires Entra ID P1/P2 in the customer tenant. Without it,
  LicenseMeter automatically falls back to usage-report activity.
- Usage reports conceal user names by default (Microsoft default since Sept
  2021). Per-user usage findings need a Global Admin to disable concealment:
  Microsoft 365 admin center > Settings > Org settings > Reports. The change
  is recorded in the Purview audit log. LicenseMeter detects the setting and
  degrades to aggregate findings when concealed.
- Revoking access: delete the workspace in Settings (removes all synced data),
  then remove "LicenseMeter Connector" under Entra ID > Enterprise applications
  in the customer tenant.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Consent dialog warns about unverified publisher | Complete publisher verification (see prerequisites) |
| `tenant_mismatch` error after consent | The consenting admin belongs to a different tenant than the signed-in user; sign in with an account from the tenant being connected |
| Sync step `signInActivity: skipped` | Customer tenant has no Entra P1/P2 (expected fallback) |
| Findings show aggregate counts only | Report concealment is on; see tenant-side notes |
| `/api/cron/sync` returns 401 | `CRON_SECRET` missing or not sent as `Authorization: Bearer <secret>` |
