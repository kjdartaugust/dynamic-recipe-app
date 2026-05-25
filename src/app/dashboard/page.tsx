import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients } from "@/lib/types";
import { Clock, Users, ChefHat, Flame, Heart } from "lucide-react";
import { RecipeSearch } from "@/components/recipe-search";
import { FavoriteButton } from "@/components/favorite-button";

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

async function getFavorites(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("recipe_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }

  return data?.map((f) => f.recipe_id) || [];
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  return data || [];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";

  // Get recipes
  const result = await getMyRecipes(userId);

  // Get favorites
  const favoriteIds = await getFavorites(userId);

  // Get categories separately for matching
  const dbCategories = await getCategories();
  const categoryMap = new Map(dbCategories.map((c) => [c.id, c.name]));

  // Manually attach category names to recipes
  const recipes = result.recipes.map((recipe) => ({
    ...recipe,
    categories: recipe.category_id
      ? { name: categoryMap.get(recipe.category_id) || "Uncategorized" }
      : null,
  }));

  // Filter recipes
  const filteredRecipes =
    filter === "favorites"
      ? recipes.filter((r) => favoriteIds.includes(r.id))
      : recipes;

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

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter !== "favorites"
              ? "bg-orange-100 text-orange-700"
              : "text-muted-foreground hover:bg-orange-50"
          }`}
        >
          <ChefHat className="h-4 w-4" />
          All Recipes
          <span className="px-1.5 py-0.5 bg-white rounded-md text-xs">{recipes.length}</span>
        </Link>
        <Link
          href="/dashboard?filter=favorites"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "favorites"
              ? "bg-red-100 text-red-700"
              : "text-muted-foreground hover:bg-red-50"
          }`}
        >
          <Heart className="h-4 w-4" />
          Favorites
          <span className="px-1.5 py-0.5 bg-white rounded-md text-xs">{favoriteIds.length}</span>
        </Link>
      </div>

      <RecipeSearch categories={dbCategories} />

      {filteredRecipes.length === 0 && !result.error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-50 rounded-full mb-6">
            {filter === "favorites" ? (
              <Heart className="h-12 w-12 text-red-300" />
            ) : (
              <ChefHat className="h-12 w-12 text-orange-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {filter === "favorites" ? "No favorites yet" : "No recipes yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {filter === "favorites"
              ? "Heart recipes to save them here"
              : "Get started by creating your first recipe"}
          </p>
          {filter !== "favorites" && (
            <Link
              href="/recipes/create"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-medium"
            >
              Create Recipe
            </Link>
          )}
        </div>
      ) : filteredRecipes.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} isFavorited={favoriteIds.includes(recipe.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, isFavorited }: { recipe: any; isFavorited: boolean }) {
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
          {/* Favorite Button */}
          <div className="absolute top-3 right-3">
            <FavoriteButton recipeId={recipe.id} initialFavorited={isFavorited} />
          </div>
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
