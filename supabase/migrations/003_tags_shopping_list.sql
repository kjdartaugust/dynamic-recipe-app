-- ============================================================
-- Dynamic Recipe App - Tags & Shopping List Migration
-- ============================================================
-- Adds:
--   - shopping_lists table with items as JSONB
--   - RLS policies for shopping_lists
--   - Default tags seed data
--   - Ensures recipe_tags junction table exists
-- ============================================================

-- ============================================================
-- 1. SHOPPING LISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'My Shopping List',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on shopping lists
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Shopping list RLS policies
CREATE POLICY "Users can view own shopping lists"
    ON public.shopping_lists
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
    ON public.shopping_lists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
    ON public.shopping_lists
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
    ON public.shopping_lists
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add index for shopping list lookups
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON public.shopping_lists(user_id);

-- Apply updated_at trigger to shopping_lists
CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. ENSURE TAGS TABLE EXISTS WITH DEFAULTS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
        CREATE TABLE public.tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tags are viewable by everyone"
            ON public.tags
            FOR SELECT
            USING (true);
    END IF;

    -- Insert sample tags if empty
    IF (SELECT COUNT(*) FROM public.tags) = 0 THEN
        INSERT INTO public.tags (name, slug) VALUES
            ('Spicy', 'spicy'),
            ('Sweet', 'sweet'),
            ('Savory', 'savory'),
            ('Quick', 'quick'),
            ('Healthy', 'healthy'),
            ('Comfort Food', 'comfort-food'),
            ('Italian', 'italian'),
            ('Asian', 'asian'),
            ('Mexican', 'mexican'),
            ('Mediterranean', 'mediterranean'),
            ('Gluten-Free', 'gluten-free'),
            ('Dairy-Free', 'dairy-free'),
            ('Vegetarian', 'vegetarian'),
            ('Vegan', 'vegan'),
            ('Low-Carb', 'low-carb'),
            ('High-Protein', 'high-protein'),
            ('One-Pot', 'one-pot'),
            ('Meal Prep', 'meal-prep'),
            ('Family-Friendly', 'family-friendly'),
            ('Party', 'party');
    END IF;
END $$;

-- ============================================================
-- 3. ENSURE RECIPE_TAGS JUNCTION TABLE EXISTS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recipe_tags') THEN
        CREATE TABLE public.recipe_tags (
            recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (recipe_id, tag_id)
        );
        ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Recipe tags are viewable by everyone"
            ON public.recipe_tags
            FOR SELECT
            USING (true);
        CREATE POLICY "Users can create tags for own recipes"
            ON public.recipe_tags
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.recipes
                    WHERE recipes.id = recipe_tags.recipe_id
                    AND recipes.user_id = auth.uid()
                )
            );
        CREATE POLICY "Users can delete tags for own recipes"
            ON public.recipe_tags
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.recipes
                    WHERE recipes.id = recipe_tags.recipe_id
                    AND recipes.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.shopping_lists IS 'User shopping lists with JSONB items array';
COMMENT ON COLUMN public.shopping_lists.items IS 'Array of {name, amount, unit, checked, recipe_id?} objects';
