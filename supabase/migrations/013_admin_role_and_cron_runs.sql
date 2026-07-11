-- ============================================================
-- 013: Admin role, denormalised profile email, cron run log
-- Run this by hand in the Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. New columns on profiles
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email for existing users.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS DISTINCT FROM u.email;

-- ------------------------------------------------------------
-- 2. Keep profiles.email in sync with auth.users.email
--    (replaces the handle_new_user from 001 so signups carry email)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_email_change();

-- ------------------------------------------------------------
-- 3. Column-level grants on profiles
--
-- Migrations 007/011 did a blanket `GRANT ALL ON public.profiles TO
-- authenticated`. Combined with the "Profiles are viewable by everyone"
-- RLS policy from 001, that would now mean:
--   * every user could read every other user's `email`  (PII leak), and
--   * any user could `UPDATE profiles SET is_admin = true` on their own
--     row and become an admin  (privilege escalation).
-- RLS is row-level and cannot stop either, so we drop to column-level
-- privileges: `email` is never selectable and `is_admin` is never
-- writable by anon/authenticated. service_role bypasses all of this and
-- is what the admin API and the cron jobs use.
-- ------------------------------------------------------------
REVOKE ALL ON public.profiles FROM anon, authenticated;

GRANT SELECT (
    id, username, avatar_url, created_at, updated_at,
    email_notifications, push_notifications, notify_before_days, is_admin
) ON public.profiles TO anon, authenticated;

GRANT INSERT (
    id, username, avatar_url,
    email_notifications, push_notifications, notify_before_days
) ON public.profiles TO authenticated;

GRANT UPDATE (
    username, avatar_url,
    email_notifications, push_notifications, notify_before_days
) ON public.profiles TO authenticated;

GRANT DELETE ON public.profiles TO authenticated;

-- ------------------------------------------------------------
-- 4. Cron run log — lets the admin dashboard show whether the
--    nightly notification jobs actually fired, instead of guessing.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cron_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job TEXT NOT NULL,
    ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ok BOOLEAN NOT NULL,
    sent INTEGER NOT NULL DEFAULT 0,
    detail TEXT
);

CREATE INDEX IF NOT EXISTS cron_runs_job_ran_at_idx
    ON public.cron_runs (job, ran_at DESC);

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (which bypasses RLS) may touch this.
REVOKE ALL ON public.cron_runs FROM anon, authenticated;

-- ------------------------------------------------------------
-- 5. Grant yourself admin (edit the email, then run)
-- ------------------------------------------------------------
-- UPDATE public.profiles SET is_admin = true WHERE email = 'you@example.com';

COMMENT ON COLUMN public.profiles.is_admin IS 'Admin flag. Only settable via SQL editor / service_role — not writable by the authenticated role.';
COMMENT ON COLUMN public.profiles.email IS 'Denormalised from auth.users. Not selectable by anon/authenticated; read via service_role only.';
COMMENT ON TABLE public.cron_runs IS 'Audit log of scheduled notification job runs, surfaced in the admin dashboard.';
