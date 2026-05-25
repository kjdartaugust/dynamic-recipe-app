-- Fix RLS policies for categories table
-- Run this in your Supabase SQL Editor

-- Enable RLS on categories table (if not already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories can be inserted by authenticated users" ON categories;

-- Allow anyone to read categories (public read)
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert categories (for seeding)
CREATE POLICY "Categories can be inserted by authenticated users"
  ON categories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies are in place
SELECT * FROM pg_policies WHERE tablename = 'categories';
