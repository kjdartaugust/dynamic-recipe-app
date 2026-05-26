-- Fix permissions for all new tables (safe to re-run)

-- Meal Plans
GRANT ALL ON public.meal_plans TO authenticated;

-- Ratings  
GRANT ALL ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO anon;

-- Categories (already done but confirming)
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO anon;

-- Shopping Lists
GRANT ALL ON public.shopping_lists TO authenticated;

-- Tags
GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.recipe_tags TO authenticated;

-- Output confirmation
SELECT 'All permissions granted successfully' as status;
