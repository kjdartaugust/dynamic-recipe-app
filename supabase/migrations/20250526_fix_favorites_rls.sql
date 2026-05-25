-- Fix favorites RLS to work with API routes
-- The API validates ownership, so RLS just needs to allow authenticated users

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

-- Allow authenticated users to read all favorites (API filters by user)
CREATE POLICY "Authenticated users can read favorites"
  ON favorites FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert favorites (API validates user_id matches)
CREATE POLICY "Authenticated users can insert favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete favorites (API validates ownership)
CREATE POLICY "Authenticated users can delete favorites"
  ON favorites FOR DELETE
  USING (auth.role() = 'authenticated');
