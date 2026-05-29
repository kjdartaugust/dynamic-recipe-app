import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients, Tag } from "@/lib/types";
import { Clock, Users, ChefHat, Flame, Heart, Search, Star, Globe, Lock, AlertTriangle } from "lucide-react";
import { RecipeSearch } from "@/components/recipe-search";
import { FavoriteButton } from "@/components/favorite-button";
import { TagDisplay } from "@/components/tag-display";
import { DashboardActions } from "@/components/dashboard-actions";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

async function getUnsplashImage(title: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const query = encodeURIComponent(`${title} food`);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`,
      { headers: { "Accept-Version": "v1" } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

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

async function getRecipeTagsMap(recipeIds: string[]): Promise<Map<string, Tag[]>> {
  if (recipeIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_tags")
    .select("recipe_id, tags(id, name, slug)")
    .in("recipe_id", recipeIds);

  const map = new Map<string, Tag[]>();
  data?.forEach((rt: any) => {
    const existing = map.get(rt.recipe_id) || [];
    existing.push(rt.tags);
    map.set(rt.recipe_id, existing);
  });
  return map;
}

async function getRecipeRatingsMap(recipeIds: string[]): Promise<Map<string, { average: number; count: number }>> {
  if (recipeIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("recipe_id, rating")
    .in("recipe_id", recipeIds);

  if (error || !data) return new Map();

  const map = new Map<string, { average: number; count: number }>();
  const groups: Record<string, number[]> = {};

  data.forEach((r: any) => {
    if (!groups[r.recipe_id]) groups[r.recipe_id] = [];
    groups[r.recipe_id].push(r.rating);
  });

  Object.entries(groups).forEach(([recipeId, ratings]) => {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    map.set(recipeId, { average: avg, count: ratings.length });
  });

  return map;
}

async function getExpiringItems(userId: string) {
  const supabase = await createClient();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("fridge_items")
    .select("name, expiry_date")
    .eq("user_id", userId)
    .lte("expiry_date", threeDaysStr)
    .gte("expiry_date", today)
    .order("expiry_date", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Failed to fetch expiring items:", error);
    return [];
  }
  return data || [];
}

async function searchRecipesDirect(
  supabase: any,
  query?: string,
  ingredients?: string,
  category?: string,
  tags?: string
): Promise<{ recipes: RecipeWithIngredients[]; error: string | null }> {
  try {
    let recipeQuery = supabase
      .from("recipes")
      .select(`
        *,
        ingredients (name, amount, unit),
        profiles (username, avatar_url),
        categories (id, name, slug)
      `)
      .order("created_at", { ascending: false });

    if (query) {
      const { data, error } = await recipeQuery
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      if (error) return { recipes: [], error: error.message };
      return { recipes: data || [], error: null };
    }

    if (category) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .maybeSingle();
      if (catData) {
        recipeQuery = recipeQuery.eq("category_id", catData.id);
      }
    }

    if (ingredients) {
      const ingredientNames = ingredients.split(",").map((s) => s.trim()).filter(Boolean);
      if (ingredientNames.length > 0) {
        let allRecipeIds: string[] = [];
        for (const name of ingredientNames) {
          const { data: matches } = await supabase
            .from("ingredients")
            .select("recipe_id")
            .ilike("name", `%${name}%`);
          if (matches) {
            allRecipeIds = [...new Set([...allRecipeIds, ...matches.map((m: any) => m.recipe_id)])];
          }
        }
        if (allRecipeIds.length > 0) {
          recipeQuery = recipeQuery.in("id", allRecipeIds);
        } else {
          return { recipes: [], error: null };
        }
      }
    }

    if (tags) {
      const tagSlugs = tags.split(",").map((s) => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        const { data: tagMatches } = await supabase
          .from("tags")
          .select("id")
          .in("slug", tagSlugs);
        const tagIds = tagMatches?.map((t: any) => t.id) || [];
        if (tagIds.length > 0) {
          const { data: rtMatches } = await supabase
            .from("recipe_tags")
            .select("recipe_id")
            .in("tag_id", tagIds);
          const recipeIds = rtMatches?.map((rt: any) => rt.recipe_id) || [];
          if (recipeIds.length > 0) {
            recipeQuery = recipeQuery.in("id", recipeIds);
          } else {
            return { recipes: [], error: null };
          }
        } else {
          return { recipes: [], error: null };
        }
      }
    }

    const { data, error } = await recipeQuery;
    if (error) return { recipes: [], error: error.message };
    return { recipes: data || [], error: null };
  } catch (err) {
    return { recipes: [], error: "Search error" };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const q = typeof params.q === "string" ? params.q : undefined;
  const ingredients = typeof params.ingredients === "string" ? params.ingredients : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const tagsParam = typeof params.tags === "string" ? params.tags : undefined;
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const hasSearchParams = q || ingredients || category || tagsParam;

  // Get recipes
  let result: { recipes: RecipeWithIngredients[]; error: string | null };
  if (hasSearchParams) {
    result = await searchRecipesDirect(supabase, q, ingredients, category, tagsParam);
  } else {
    result = await getMyRecipes(userId);
  }

  // Get favorites
  const favoriteIds = await getFavorites(userId);

  // Get expiring fridge items
  const expiringItems = await getExpiringItems(userId);

  // Get categories separately for matching
  const dbCategories = await getCategories();
  const categoryMap = new Map(dbCategories.map((c) => [c.id, c.name]));

  // Get tags and ratings for all recipes
  const recipeIds = result.recipes.map((r) => r.id);
  const [tagsMap, ratingsMap] = await Promise.all([
    getRecipeTagsMap(recipeIds),
    getRecipeRatingsMap(recipeIds),
  ]);

  // Manually attach category names, tags, and ratings to recipes
  let recipes = result.recipes.map((recipe) => ({
    ...recipe,
    categories: recipe.category_id
      ? { name: categoryMap.get(recipe.category_id) || "Uncategorized" }
      : null,
    tags: tagsMap.get(recipe.id) || [],
    rating: ratingsMap.get(recipe.id) || null,
  }));

  // Fetch Unsplash images for recipes without images
  const recipesWithoutImages = recipes.filter((r) => !r.image_url);
  if (recipesWithoutImages.length > 0) {
    const imagePromises = recipesWithoutImages.map(async (recipe) => {
      const imageUrl = await getUnsplashImage(recipe.title);
      return { id: recipe.id, imageUrl };
    });
    const imageResults = await Promise.all(imagePromises);
    const imageMap = new Map(imageResults.map((r) => [r.id, r.imageUrl]));
    
    recipes = recipes.map((recipe) => ({
      ...recipe,
      image_url: recipe.image_url || imageMap.get(recipe.id) || null,
    }));
  }

  // Sort by popularity if filter is "popular"
  if (filter === "popular") {
    recipes = recipes.sort((a, b) => {
      const aAvg = a.rating?.average || 0;
      const bAvg = b.rating?.average || 0;
      return bAvg - aAvg;
    });
  }

  // Filter recipes
  const filteredRecipes =
    filter === "favorites"
      ? recipes.filter((r) => favoriteIds.includes(r.id))
      : recipes;

  const isSearchActive = hasSearchParams && filter !== "favorites";

  // Pagination
  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(filteredRecipes.length / PAGE_SIZE);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const buildPageUrl = (page: number) => {
    const p = new URLSearchParams();
    if (filter && filter !== "all") p.set("filter", filter);
    if (q) p.set("q", q);
    if (ingredients) p.set("ingredients", ingredients);
    if (category) p.set("category", category);
    if (tagsParam) p.set("tags", tagsParam);
    p.set("page", String(page));
    return `/dashboard?${p.toString()}`;
  };

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

      {expiringItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800">
                {expiringItems.length} item{expiringItems.length > 1 ? "s" : ""} expiring soon
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {expiringItems.map((item) => item.name).join(", ")} — use them before they go to waste!
              </p>
              <Link
                href="/fridge"
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900 mt-2 underline underline-offset-2"
              >
                View My Fridge →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">My Recipes</h1>
          <p className="text-muted-foreground mt-1">
            Your personal recipe collection
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Public Sharing Tip */}
      {recipes.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Share your recipes with the community
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Your recipes are <strong>private by default</strong>. Open any recipe and click the{" "}
              <Lock className="h-3 w-3 inline" /> Private badge to make it public. Public recipes appear on the{" "}
              <Link href="/explore" className="underline hover:text-blue-800">Explore</Link> page.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all" || (!filter && !hasSearchParams)
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
        <Link
          href="/dashboard?filter=popular"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "popular"
              ? "bg-yellow-100 text-yellow-700"
              : "text-muted-foreground hover:bg-yellow-50"
          }`}
        >
          <Star className="h-4 w-4" />
          Most Popular
        </Link>
      </div>

      <RecipeSearch categories={dbCategories} currentFilter={filter} />

      {isSearchActive && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4 text-orange-400" />
          <span>
            Showing {filteredRecipes.length} result{filteredRecipes.length !== 1 ? "s" : ""}
            {q ? ` for "${q}"` : ""}
            {ingredients ? ` with ingredients "${ingredients}"` : ""}
          </span>
        </div>
      )}

      {/* Pagination info */}
      {filteredRecipes.length > PAGE_SIZE && (
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({filteredRecipes.length} recipes)
        </div>
      )}

      {filteredRecipes.length === 0 && !result.error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-50 rounded-full mb-6">
            {filter === "favorites" ? (
              <Heart className="h-12 w-12 text-red-300" />
            ) : filter === "popular" ? (
              <Star className="h-12 w-12 text-yellow-400" />
            ) : (
              <ChefHat className="h-12 w-12 text-orange-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {filter === "favorites"
              ? "No favorites yet"
              : filter === "popular"
              ? "No rated recipes yet"
              : isSearchActive
              ? "No recipes found"
              : "No recipes yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {filter === "favorites"
              ? "Heart recipes to save them here"
              : filter === "popular"
              ? "Rate your recipes to see them here"
              : isSearchActive
              ? "Try adjusting your search or filters"
              : "Get started by creating your first recipe"}
          </p>
          {filter !== "favorites" && filter !== "popular" && !isSearchActive && (
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
          {paginatedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} isFavorited={favoriteIds.includes(recipe.id)} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link
            href={buildPageUrl(currentPage - 1)}
            className={`px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium transition-colors ${
              currentPage <= 1
                ? "opacity-50 pointer-events-none text-muted-foreground"
                : "hover:bg-orange-50 text-foreground"
            }`}
          >
            Previous
          </Link>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={buildPageUrl(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                    : "hover:bg-orange-50 text-foreground"
                }`}
              >
                {page}
              </Link>
            ))}
          </div>
          <Link
            href={buildPageUrl(currentPage + 1)}
            className={`px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium transition-colors ${
              currentPage >= totalPages
                ? "opacity-50 pointer-events-none text-muted-foreground"
                : "hover:bg-orange-50 text-foreground"
            }`}
          >
            Next
          </Link>
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
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-lg line-clamp-1 text-foreground group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </h2>
                {recipe.rating && recipe.rating.count > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {recipe.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}
          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <TagDisplay tags={recipe.tags} size="sm" />
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
