-- ============================================================
-- DISABLE EMAIL CONFIRMATION (For Development/Testing)
-- ============================================================
-- WARNING: Only run this in development!
-- This allows users to sign up without email verification.
-- For production, keep email confirmation enabled.
-- ============================================================

-- Update auth.users to auto-confirm emails
-- This is done through Supabase Dashboard, not SQL
-- Go to: Authentication > Providers > Email > Disable "Confirm email"

-- Alternative: Create a function to auto-confirm users (for dev only)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-confirm the email
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm (optional - for dev only)
-- DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
-- CREATE TRIGGER auto_confirm_trigger
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.auto_confirm_user();

-- To remove the trigger later:
-- DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
