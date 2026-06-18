-- Defense-in-depth: revoke the default Supabase PostgREST grants on the public
-- schema from the anon and authenticated API roles.
--
-- Why: the app talks to Postgres only through the dedicated least-privilege
-- `licensemeter_app` role (direct postgres-js connection; no Supabase client,
-- no anon key shipped to browsers). The auto-generated REST/GraphQL API and its
-- anon/authenticated roles are never used. Every table already has RLS enabled
-- with a single policy scoped to `licensemeter_app`, so anon/authenticated were
-- already blocked -- but Supabase's default GRANTs to those roles remained.
-- Removing them ensures a future RLS gap or an accidental permissive policy
-- cannot expose tenant data or AES-256-GCM-encrypted connector secrets via the
-- public API. After this runs, anon/authenticated get `42501 permission denied`
-- before RLS is even evaluated.
--
-- How to run: as a privileged role (postgres) -- via the Supabase SQL editor or
-- an admin connection. It is NOT part of the drizzle-kit migration chain, which
-- connects as `licensemeter_app` and cannot REVOKE on postgres-owned tables.
-- Idempotent: safe to re-run. Re-run after adding new tables if the default
-- privileges below were not in effect when they were created.
--
-- Prerequisite: the deny-all posture is already in place -- run
-- db-enable-rls-deny-all.sql then db-app-role-grants-and-policies.sql first. The
-- `licensemeter_app` role itself is created manually (out of repo: it carries
-- the DATABASE_URL password). Applied to production
-- (project licensemeter / tomugclophxlmnzrrcxp) on 2026-06-17.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Stop future tables (created by postgres, the owner of every public table)
-- from re-acquiring the default grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
