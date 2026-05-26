import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weekStart } = body;

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
    }

    // Fetch the meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from("meal_plans")
      .select("meals")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (planError || !mealPlan) {
      return NextResponse.json(
        { error: "No meal plan found for this week" },
        { status: 404 }
      );
    }

    // Collect all recipe IDs from the meal plan
    const recipeIds: string[] = [];
    const meals = mealPlan.meals as Record<string, Record<string, string>>;

    Object.values(meals).forEach((dayMeals) => {
      Object.values(dayMeals).forEach((recipeId) => {
        if (recipeId) recipeIds.push(recipeId);
      });
    });

    if (recipeIds.length === 0) {
      return NextResponse.json(
        { error: "No recipes in meal plan" },
        { status: 400 }
      );
    }

    // Fetch ingredients for all recipes
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("ingredients")
      .select("name, amount, unit, recipe_id")
      .in("recipe_id", recipeIds);

    if (ingredientsError) {
      console.error("[MEAL_PLAN_SHOPPING] Error fetching ingredients:", ingredientsError);
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 500 }
      );
    }

    // Aggregate ingredients by name
    const aggregated: Record<
      string,
      { amount: number; unit: string; recipeIds: string[] }
    > = {};

    ingredients?.forEach((ing) => {
      const key = ing.name.toLowerCase().trim();
      if (!aggregated[key]) {
        aggregated[key] = {
          amount: ing.amount || 0,
          unit: ing.unit || "piece",
          recipeIds: [ing.recipe_id],
        };
      } else {
        // Only sum if units match
        if (aggregated[key].unit === ing.unit) {
          aggregated[key].amount += ing.amount || 0;
        }
        if (!aggregated[key].recipeIds.includes(ing.recipe_id)) {
          aggregated[key].recipeIds.push(ing.recipe_id);
        }
      }
    });

    // Convert to shopping list items
    const shoppingItems = Object.entries(aggregated).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: data.amount,
      unit: data.unit,
      checked: false,
      recipe_ids: data.recipeIds,
    }));

    return NextResponse.json({ items: shoppingItems });
  } catch (error) {
    console.error("[MEAL_PLAN_SHOPPING] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
