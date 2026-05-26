import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/search?q=...&ingredients=...&category=...&tags=...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();
    const ingredientsParam = searchParams.get("ingredients")?.trim().toLowerCase();
    const category = searchParams.get("category")?.trim();
    const tagsParam = searchParams.get("tags")?.trim();

    let recipeQuery = supabase.from("recipes").select(
      `*,
      ingredients (name, amount, unit),
      profiles (username, avatar_url),
      categories (id, name, slug)
    `
    );

    // Text search on title and description
    if (query) {
      const { data: searchResults, error } = await recipeQuery
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ recipes: searchResults || [] });
    }

    // Category filter
    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .maybeSingle();

      if (categoryData) {
        recipeQuery = recipeQuery.eq("category_id", categoryData.id);
      }
    }

    // Ingredient search filter
    let recipeIdsFromIngredientSearch: string[] | null = null;
    if (ingredientsParam) {
      const ingredientNames = ingredientsParam.split(",").map((s) => s.trim()).filter(Boolean);

      if (ingredientNames.length > 0) {
        const { data: ingredientMatches, error: ingError } = await supabase
          .from("ingredients")
          .select("recipe_id, name")
          .ilike("name", `%${ingredientNames[0]}%`);

        if (ingError) {
          return NextResponse.json({ error: ingError.message }, { status: 500 });
        }

        recipeIdsFromIngredientSearch = ingredientMatches?.map((i) => i.recipe_id) || [];

        for (let i = 1; i < ingredientNames.length; i++) {
          const { data: moreMatches } = await supabase
            .from("ingredients")
            .select("recipe_id")
            .ilike("name", `%${ingredientNames[i]}%`);

          if (moreMatches) {
            const moreIds = moreMatches.map((m) => m.recipe_id);
            recipeIdsFromIngredientSearch = [
              ...new Set([...(recipeIdsFromIngredientSearch || []), ...moreIds]),
            ];
          }
        }

        if (recipeIdsFromIngredientSearch && recipeIdsFromIngredientSearch.length > 0) {
          recipeQuery = recipeQuery.in("id", recipeIdsFromIngredientSearch);
        } else {
          return NextResponse.json({ recipes: [] });
        }
      }
    }

    // Tag filter
    if (tagsParam) {
      const tagSlugs = tagsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        const { data: tagMatches } = await supabase
          .from("tags")
          .select("id")
          .in("slug", tagSlugs);

        const tagIds = tagMatches?.map((t) => t.id) || [];

        if (tagIds.length > 0) {
          const { data: recipeTagMatches } = await supabase
            .from("recipe_tags")
            .select("recipe_id")
            .in("tag_id", tagIds);

          const taggedRecipeIds = recipeTagMatches?.map((rt) => rt.recipe_id) || [];

          if (taggedRecipeIds.length > 0) {
            recipeQuery = recipeQuery.in("id", taggedRecipeIds);
          } else {
            return NextResponse.json({ recipes: [] });
          }
        } else {
          return NextResponse.json({ recipes: [] });
        }
      }
    }

    const { data: recipes, error } = await recipeQuery.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recipes: recipes || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
