-- ============================================================
-- Dynamic Recipe App - Enhanced Database Schema
-- ============================================================
-- Adds: categories, tags, favorites, recipe_tags junction table
-- Run this in Supabase SQL Editor after the initial schema
-- ============================================================

-- ============================================================
-- 1. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories 
    FOR SELECT 
    USING (true);

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
    ('Breakfast', 'breakfast', 'Morning meals and breakfast recipes'),
    ('Lunch', 'lunch', 'Midday meals and lunch ideas'),
    ('Dinner', 'dinner', 'Evening meals and dinner recipes'),
    ('Dessert', 'dessert', 'Sweet treats and desserts'),
    ('Snack', 'snack', 'Quick bites and snacks'),
    ('Vegan', 'vegan', 'Plant-based recipes'),
    ('Gluten-Free', 'gluten-free', 'Gluten-free recipes'),
    ('Quick & Easy', 'quick-easy', 'Recipes under 30 minutes'),
    ('Healthy', 'healthy', 'Nutritious and healthy options'),
    ('Drinks', 'drinks', 'Beverages and cocktails')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. ADD CATEGORY TO RECIPES
-- ============================================================
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add index for category queries
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON public.recipes(category_id);

-- ============================================================
-- 3. TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags are viewable by everyone
CREATE POLICY "Tags are viewable by everyone" 
    ON public.tags 
    FOR SELECT 
    USING (true);

-- ============================================================
-- 4. RECIPE_TAGS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recipe_tags (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (recipe_id, tag_id)
);

-- Enable RLS on recipe_tags
ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

-- Recipe tags are viewable by everyone
CREATE POLICY "Recipe tags are viewable by everyone" 
    ON public.recipe_tags 
    FOR SELECT 
    USING (true);

-- Allow authenticated users to create recipe tags for their recipes
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

-- Allow users to delete tags for their own recipes
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

-- ============================================================
-- 5. FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" 
    ON public.favorites 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites" 
    ON public.favorites 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites" 
    ON public.favorites 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Add index for faster favorite lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON public.favorites(recipe_id);

-- ============================================================
-- 6. ADD PREP TIME AND COOK TIME TO RECIPES
-- ============================================================
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS prep_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS cook_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS servings INTEGER,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- ============================================================
-- 7. COMMENTS
-- ============================================================
COMMENT ON TABLE public.categories IS 'Recipe categories for organization';
COMMENT ON TABLE public.tags IS 'Tags for recipe classification';
COMMENT ON TABLE public.recipe_tags IS 'Junction table linking recipes to tags';
COMMENT ON TABLE public.favorites IS 'User favorite recipes';
