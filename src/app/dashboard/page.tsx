import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients } from "@/lib/types";
import { Clock, Users, ChefHat, Search, SlidersHorizontal } from "lucide-react";
import { RecipeSearch } from "@/components/recipe-search";

export const metadata = {
  title: "Dashboard",
  description:
    "Browse and discover recipes. View your collection of AI-generated and custom recipes.",
};

async function getRecipes(): Promise<RecipeWithIngredients[]> {
  const supabase = await createClient();
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients (*),
      profiles (username, avatar_url),
      categories (name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }

  return recipes || [];
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
  const recipes = await getRecipes();
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Discover and manage your recipes
          </p>
        </div>
        <Link
          href="/recipes/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <ChefHat className="h-4 w-4" />
          Create Recipe
        </Link>
      </div>

      <RecipeSearch categories={categories} />

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No recipes yet</h2>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first recipe
          </p>
          <Link
            href="/recipes/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Create Recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  const ingredientCount = recipe.ingredients?.length || 0;
  const calories = recipe.macros?.calories;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <article className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ChefHat className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {recipe.categories && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 text-xs font-medium bg-black/50 text-white rounded-full">
                {recipe.categories.name}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <h2 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {recipe.title}
          </h2>
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {ingredientCount} ingredients
            </span>
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalTime} min
              </span>
            )}
            {calories && (
              <span className="flex items-center gap-1">
                {calories} cal
              </span>
            )}
          </div>
          {recipe.profiles && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {recipe.profiles.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm text-muted-foreground">
                {recipe.profiles.username}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
