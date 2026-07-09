-- Read-only production guardrail for the invariants established by the three
-- db-* security setup scripts. Run as the privileged/admin role after every
-- schema change. Any drift raises an exception so automation fails closed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Supabase posture check failed: a public table has RLS disabled';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (
        has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
        OR has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
      )
  ) THEN
    RAISE EXCEPTION 'Supabase posture check failed: a public table is granted to an API role';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT has_table_privilege(
        'licensemeter_app',
        c.oid,
        'SELECT, INSERT, UPDATE, DELETE'
      )
  ) THEN
    RAISE EXCEPTION 'Supabase posture check failed: licensemeter_app lacks table DML';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_policy p
        JOIN pg_roles r ON r.oid = ANY (p.polroles)
        WHERE p.polrelid = c.oid
          AND p.polname = 'app_all'
          AND r.rolname = 'licensemeter_app'
      )
  ) THEN
    RAISE EXCEPTION 'Supabase posture check failed: a public table lacks the app_all policy';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint fk
    JOIN pg_namespace n ON n.oid = fk.connamespace
    WHERE n.nspname = 'public'
      AND fk.contype = 'f'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = fk.conrelid
          AND i.indisvalid
          AND i.indisready
          AND fk.conkey <@ i.indkey::smallint[]
      )
  ) THEN
    RAISE EXCEPTION 'Supabase posture check failed: a foreign key lacks a covering index';
  END IF;

  RAISE NOTICE 'Supabase posture check passed';
END $$;
