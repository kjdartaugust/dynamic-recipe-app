-- ============================================================
-- 014: Grant table privileges to service_role
-- Run this by hand in the Supabase SQL Editor.
-- ============================================================
--
-- Every migration in this project grants to `authenticated` (and sometimes
-- `anon`), but none has ever granted anything to `service_role`. In a stock
-- Supabase project ALTER DEFAULT PRIVILEGES covers that automatically; here
-- it plainly does not — which is why 001-012 had to hand-grant `authenticated`
-- on every table, and why "permission denied for table recipes" is a known
-- error in this repo's README.
--
-- The consequence only surfaced once the admin dashboard and the notification
-- crons started using the service-role client: `service_role` bypasses ROW
-- LEVEL SECURITY, but it does NOT bypass table GRANTs — those are ordinary
-- Postgres privileges. So a perfectly valid service_role key still failed
-- every query with `permission denied for table ...`.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure tables added later are covered too, so this cannot silently recur.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO service_role;

-- Sanity check — should list profiles, recipes, fridge_items, cron_runs, …
-- SELECT table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee = 'service_role' AND table_schema = 'public'
-- ORDER BY table_name;
