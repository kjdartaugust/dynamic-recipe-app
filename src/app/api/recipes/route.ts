import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, instructions, ingredients, macros } = body;

    if (!title || !instructions) {
      return NextResponse.json(
        { error: "Title and instructions are required" },
        { status: 400 }
      );
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        instructions,
        macros: macros || {},
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Create ingredients
    if (ingredients && ingredients.length > 0) {
      const { error: ingredientsError } = await supabase
        .from("ingredients")
        .insert(
          ingredients.map((ing: any) => ({
            recipe_id: recipe.id,
            name: ing.name,
            amount: parseFloat(ing.amount),
            unit: ing.unit,
          }))
        );

      if (ingredientsError) throw ingredientsError;
    }

    return NextResponse.json({
      success: true,
      id: recipe.id,
      recipe,
    });
  } catch (error) {
    console.error("Error saving recipe:", error);
    return NextResponse.json(
      {
        error: "Failed to save recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
