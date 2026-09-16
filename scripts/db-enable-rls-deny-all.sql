-- Enable Row Level Security on every table in the public schema.
--
-- Why: LicenseMeter never uses the Supabase Data API (PostgREST/GraphQL). The
-- app reaches Postgres through one dedicated least-privilege role,
-- `licensemeter_app` (direct postgres-js connection; no Supabase client, no anon
-- key in the browser). Turning RLS on with no policy for the API roles makes the
-- REST surface deny-all. `licensemeter_app` is itself subject to RLS and is
-- granted access only through the explicit `app_all` policy created in
-- db-app-role-grants-and-policies.sql; tenant isolation is then enforced in the
-- application layer (every query filters by tenant_id), not by RLS.
--
-- Invariant, not a list: this loops over ALL public tables so a table added
-- later cannot silently ship without RLS. Idempotent -- ENABLE ROW LEVEL
-- SECURITY is a no-op on a table that already has it. Run again after adding
-- tables (harmless if you forget the exact set; the loop covers everything).
--
-- How to run: as a privileged role (postgres), via the Supabase SQL editor or an
-- admin connection. NOT part of the drizzle-kit chain, which connects as the
-- unprivileged `licensemeter_app`.
-- Run these scripts for your own deployment.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
