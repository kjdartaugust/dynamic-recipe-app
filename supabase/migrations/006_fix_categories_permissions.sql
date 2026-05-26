-- Fix categories table permissions
-- Categories should be readable by everyone (they're reference data)

-- Ensure RLS is enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories are readable by everyone" ON categories;

-- Create policy: anyone can read categories
CREATE POLICY "Categories are readable by everyone"
  ON categories
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO anon;
