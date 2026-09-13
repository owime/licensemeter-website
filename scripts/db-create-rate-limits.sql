-- Target: LicenseMeter production (tomugclophxlmnzrrcxp).
-- Run as postgres. Add only the counter table required by rateLimitDurable.
-- Keep counters private to the trusted application role, matching the existing
-- database access model. Safe to rerun; no existing rows are changed.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO licensemeter_app;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rate_limits'
      AND policyname = 'app_all'
  ) THEN
    CREATE POLICY app_all ON public.rate_limits
      FOR ALL TO licensemeter_app USING (true) WITH CHECK (true);
  END IF;
END $$;
