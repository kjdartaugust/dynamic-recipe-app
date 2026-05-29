import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const sort = searchParams.get("sort") || "recent"; // recent, popular, oldest

    const supabase = await createClient();

    // Build query for public recipes
    let query = supabase
      .from("recipes")
      .select(
        "id, title, description, image_url, category_id, prep_time, cook_time, servings, difficulty, created_at, user_id, macros",
        { count: "exact" }
      )
      .eq("is_public", true);

    // Apply sorting
    switch (sort) {
      case "popular":
        // We'll sort by rating count after fetching
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "recent":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: recipes, error, count } = await query;

    if (error) {
      console.error("[EXPLORE] Error fetching public recipes:", error);
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      );
    }

    // Fetch authors (profiles) for these recipes
    const userIds = [...new Set(recipes?.map((r) => r.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Fetch ratings for these recipes
    const recipeIds = recipes?.map((r) => r.id) || [];
    const { data: ratings } = await supabase
      .from("ratings")
      .select("recipe_id, rating")
      .in("recipe_id", recipeIds);

    // Calculate average ratings
    const ratingMap = new Map<string, { average: number; count: number }>();
    if (ratings) {
      const groups: Record<string, number[]> = {};
      ratings.forEach((r) => {
        if (!groups[r.recipe_id]) groups[r.recipe_id] = [];
        groups[r.recipe_id].push(r.rating);
      });
      Object.entries(groups).forEach(([id, vals]) => {
        ratingMap.set(id, {
          average: vals.reduce((a, b) => a + b, 0) / vals.length,
          count: vals.length,
        });
      });
    }

    // Fetch categories
    const categoryIds = [
      ...new Set(recipes?.map((r) => r.category_id).filter(Boolean) || []),
    ];
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .in("id", categoryIds);

    const categoryMap = new Map(categories?.map((c) => [c.id, c]) || []);

    // Enrich recipes with author, rating, and category info
    let enrichedRecipes =
      recipes?.map((recipe) => ({
        ...recipe,
        author: profileMap.get(recipe.user_id) || null,
        rating: ratingMap.get(recipe.id) || null,
        category: recipe.category_id
          ? categoryMap.get(recipe.category_id) || null
          : null,
      })) || [];

    // Fetch Unsplash images for recipes without images
    const recipesWithoutImages = enrichedRecipes.filter((r) => !r.image_url);
    if (recipesWithoutImages.length > 0) {
      const imagePromises = recipesWithoutImages.map(async (recipe) => {
        const imageUrl = await getUnsplashImage(recipe.title);
        return { id: recipe.id, imageUrl };
      });
      const imageResults = await Promise.all(imagePromises);
      const imageMap = new Map(imageResults.map((r) => [r.id, r.imageUrl]));
      
      enrichedRecipes = enrichedRecipes.map((recipe) => ({
        ...recipe,
        image_url: recipe.image_url || imageMap.get(recipe.id) || null,
      }));
    }

    // If sorting by popularity, do it client-side
    let sortedRecipes = enrichedRecipes;
    if (sort === "popular") {
      sortedRecipes = enrichedRecipes.sort((a, b) => {
        const aCount = a.rating?.count || 0;
        const bCount = b.rating?.count || 0;
        return bCount - aCount;
      });
    }

    return NextResponse.json({
      recipes: sortedRecipes,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("[EXPLORE] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
