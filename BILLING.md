# Free service

LicenseMeter is free for every workspace, including MSP portfolios. There are no subscriptions, paid tiers, trial clocks, payment gates or billing reminder emails.

Stripe checkout, portal and webhook routes, setup scripts, environment configuration and the SDK have been removed. Old `/app/billing` links redirect to the dashboard; `/app/msp` redirects to the multi-workspace portfolio.

Historical billing columns and tables remain in the database for compatibility. They are not used to determine access and this change does not delete or migrate customer data. New connections do not start trial clocks.

The owner confirmed there are no active LicenseMeter subscriptions in Stripe. This code change does not cancel external subscriptions. Remove obsolete Stripe environment variables and webhook registrations from hosting/provider settings when deploying. The trial reminder cron is removed from `vercel.json`.

Rollback: redeploy the previous application revision and restore its environment configuration if necessary. The database schema is unchanged. Confirm the intended commercial behavior before restoring a version that can charge customers.
