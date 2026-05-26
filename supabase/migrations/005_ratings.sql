-- Ratings & Reviews Schema

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings
  FOR SELECT
  USING (true);

-- Policy: Users can only manage their own ratings
CREATE POLICY "Users can manage their own ratings"
  ON ratings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.ratings TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ratings_updated_at ON ratings;
CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_ratings_updated_at();
