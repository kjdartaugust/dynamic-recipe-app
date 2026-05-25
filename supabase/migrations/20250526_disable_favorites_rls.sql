-- Disable RLS on favorites table (we handle auth in API code)
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can read favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can delete favorites" ON favorites;
