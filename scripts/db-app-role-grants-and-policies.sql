-- Grant the least-privilege application role DML on the public schema and give
-- it a permissive RLS policy on every table.
--
-- Context: `licensemeter_app` is the only role the app connects as (its
-- credentials are the DATABASE_URL). It is NOT a table owner, so it is subject
-- to RLS (enabled in db-enable-rls-deny-all.sql) and needs an explicit policy to
-- read or write. The `app_all` policy is permissive (USING true) because tenant
-- isolation is enforced in application code, not in the database -- the policy's
-- job is only to keep the Data API roles (anon/authenticated) deny-all while
-- letting the trusted app role through.
--
-- Prerequisite (manual, out of repo -- carries a secret, so not committed):
--   CREATE ROLE licensemeter_app LOGIN PASSWORD '<generated>';
-- The password is the one embedded in DATABASE_URL. Create the role first, then
-- run db-enable-rls-deny-all.sql, then this file, then
-- db-revoke-public-api-grants.sql.
--
-- Invariant, not a list: the policy loop covers ALL public tables so a new table
-- cannot silently ship without the app role's policy. Idempotent -- DROP POLICY
-- IF EXISTS precedes each CREATE, and the GRANTs are safe to repeat. Run again
-- after adding tables.
--
-- How to run: as a privileged role (postgres). First applied to production
-- (project licensemeter / tomugclophxlmnzrrcxp) on 2026-06-11.

GRANT USAGE ON SCHEMA public TO licensemeter_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO licensemeter_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO licensemeter_app;

-- Cover tables created later by the owner (postgres) without re-running grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO licensemeter_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO licensemeter_app;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS app_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY app_all ON public.%I FOR ALL TO licensemeter_app USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
