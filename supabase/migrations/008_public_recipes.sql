-- Add public visibility to recipes
-- Allows recipes to be shared publicly and discovered

-- Add is_public column with default false
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policies for recipes

-- Existing policy: users can CRUD their own recipes
-- No change needed for owner access

-- Add policy: anyone can VIEW public recipes
DROP POLICY IF EXISTS "Anyone can view public recipes" ON recipes;

CREATE POLICY "Anyone can view public recipes"
  ON recipes
  FOR SELECT
  USING (is_public = true);

-- Note: The owner's select policy still allows them to see all their own recipes
-- Even private ones. These policies work together (OR logic).

-- Add index for performance on public recipe queries
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_recipes_user_id_public ON recipes(user_id, is_public);

-- Grant permissions
GRANT ALL ON public.recipes TO authenticated;

-- Output confirmation
SELECT 'Public recipe visibility added successfully' as status;
