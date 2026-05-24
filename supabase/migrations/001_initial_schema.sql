-- ============================================================
-- Dynamic Recipe App - Initial Database Schema
-- ============================================================
-- This script sets up the foundational database schema for the
-- Zero-Cost AI-Driven Recipe Web App using Supabase.
--
-- Tables:
--   - profiles: User profiles linked to auth.users
--   - recipes: Recipe storage with metadata and macros
--   - ingredients: Recipe ingredients with quantities
--
-- Security:
--   - Row Level Security (RLS) enabled on all tables
--   - Public read access for recipes and ingredients
--   - Authenticated users can only modify their own data
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
-- Stores extended user profile information linked to Supabase Auth

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Allow users to read any profile (public profiles)
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles 
    FOR SELECT 
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Allow users to delete only their own profile
CREATE POLICY "Users can delete own profile" 
    ON public.profiles 
    FOR DELETE 
    USING (auth.uid() = id);

-- ============================================================
-- 2. RECIPES TABLE
-- ============================================================
-- Stores recipe information with macronutrient data

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    macros JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

-- Enable RLS on recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Recipes RLS Policies
-- Allow anyone to read recipes (public access)
CREATE POLICY "Recipes are viewable by everyone" 
    ON public.recipes 
    FOR SELECT 
    USING (true);

-- Allow authenticated users to create recipes
CREATE POLICY "Authenticated users can create recipes" 
    ON public.recipes 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own recipes
CREATE POLICY "Users can update own recipes" 
    ON public.recipes 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Allow users to delete only their own recipes
CREATE POLICY "Users can delete own recipes" 
    ON public.recipes 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================
-- 3. INGREDIENTS TABLE
-- ============================================================
-- Stores ingredients linked to specific recipes

CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster recipe-based queries
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON public.ingredients(recipe_id);

-- Enable RLS on ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- Ingredients RLS Policies
-- Allow anyone to read ingredients (public access)
CREATE POLICY "Ingredients are viewable by everyone" 
    ON public.ingredients 
    FOR SELECT 
    USING (true);

-- Allow authenticated users to create ingredients for their recipes
CREATE POLICY "Users can create ingredients for own recipes" 
    ON public.ingredients 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Allow users to update ingredients for their own recipes
CREATE POLICY "Users can update ingredients for own recipes" 
    ON public.ingredients 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Allow users to delete ingredients for their own recipes
CREATE POLICY "Users can delete ingredients for own recipes" 
    ON public.ingredients 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- ============================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================================
-- Automatically update the updated_at timestamp on row modifications

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to recipes
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to ingredients
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON public.ingredients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. HANDLE NEW USER SIGNUP
-- ============================================================
-- Automatically create a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase Auth users';
COMMENT ON TABLE public.recipes IS 'Recipe storage with AI-generated and user-created recipes';
COMMENT ON TABLE public.ingredients IS 'Ingredients linked to specific recipes with quantities';

COMMENT ON COLUMN public.recipes.macros IS 'JSON object containing estimated macronutrients (calories, protein, carbs, fat)';
COMMENT ON COLUMN public.ingredients.amount IS 'Numeric quantity of the ingredient';
COMMENT ON COLUMN public.ingredients.unit IS 'Unit of measurement (g, ml, cup, tbsp, etc.)';
