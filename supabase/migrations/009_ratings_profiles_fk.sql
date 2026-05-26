-- Add foreign key relationship between ratings and profiles
-- This allows Supabase to resolve the profiles join in queries

-- Add FK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ratings_user_id_fkey'
    AND table_name = 'ratings'
  ) THEN
    ALTER TABLE ratings
    ADD CONSTRAINT ratings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Also ensure profiles table has proper select policy for joins
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

-- Grant select on profiles
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

SELECT 'Ratings-Profiles FK and policies added successfully' as status;
