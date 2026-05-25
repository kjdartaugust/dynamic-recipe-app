import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients } from "@/lib/types";
import { Clock, Users, ChefHat, Flame } from "lucide-react";
import { RecipeSearch } from "@/components/recipe-search";

export const metadata = {
  title: "Dashboard",
  description: "Your personal recipe collection",
};

async function getMyRecipes(userId: string): Promise<{ recipes: RecipeWithIngredients[]; error: string | null }> {
  const supabase = await createClient();
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients (*),
      profiles (username, avatar_url)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { recipes: [], error: error.message };
  }

  return { recipes: recipes || [], error: null };
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  return data || [];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get recipes (joined with ingredients + profiles, but NOT categories to avoid RLS issues)
  const result = await getMyRecipes(userId);

  // Get categories separately for matching
  const dbCategories = await getCategories();
  const categoryMap = new Map(dbCategories.map(c => [c.id, c.name]));

  // Manually attach category names to recipes (avoids join RLS problems)
  const recipes = result.recipes.map(recipe => ({
    ...recipe,
    categories: recipe.category_id
      ? { name: categoryMap.get(recipe.category_id) || "Uncategorized" }
      : null,
  }));

  return (
    <div className="space-y-8">
      {result.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <Flame className="h-4 w-4" />
            Query Error
          </div>
          <p className="text-sm text-red-700 mt-1">{result.error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">My Recipes</h1>
          <p className="text-muted-foreground mt-1">
            Your personal recipe collection
          </p>
        </div>
        <Link
          href="/recipes/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl font-medium"
        >
          <ChefHat className="h-4 w-4" />
          Create Recipe
        </Link>
      </div>

      <RecipeSearch categories={dbCategories} />

      {recipes.length === 0 && !result.error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-50 rounded-full mb-6">
            <ChefHat className="h-12 w-12 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No recipes yet</h2>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first recipe
          </p>
          <Link
            href="/recipes/create"
            className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-medium"
          >
            Create Recipe
          </Link>
        </div>
      ) : recipes.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: any }) {
  const ingredientCount = recipe.ingredients?.length || 0;
  const calories = recipe.macros?.calories;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <article className="card-gradient rounded-xl overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Flame className="h-14 w-14 text-orange-200 fire-icon" />
            </div>
          )}
          {recipe.categories?.name && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-md">
                {recipe.categories.name}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          <h2 className="font-semibold text-lg line-clamp-1 text-foreground group-hover:text-orange-600 transition-colors">
            {recipe.title}
          </h2>
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-orange-100">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-orange-400" />
              {ingredientCount} ingredients
            </span>
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
                {totalTime} min
              </span>
            )}
            {calories && (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                {calories} cal
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
