import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      console.error("[MEAL_PLAN] Error fetching:", error);
      return NextResponse.json({ error: "Failed to fetch meal plan" }, { status: 500 });
    }

    return NextResponse.json({ mealPlan: data || null });
  } catch (error) {
    console.error("[MEAL_PLAN] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weekStart, meals } = body;

    if (!weekStart || !meals) {
      return NextResponse.json(
        { error: "weekStart and meals are required" },
        { status: 400 }
      );
    }

    // Upsert: insert or update
    const { data, error } = await supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          meals,
        },
        {
          onConflict: "user_id,week_start",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[MEAL_PLAN] Error saving:", error);
      return NextResponse.json({ error: "Failed to save meal plan" }, { status: 500 });
    }

    return NextResponse.json({ mealPlan: data });
  } catch (error) {
    console.error("[MEAL_PLAN] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (error) {
      console.error("[MEAL_PLAN] Error deleting:", error);
      return NextResponse.json({ error: "Failed to delete meal plan" }, { status: 500 });
    }

    return NextResponse.json({ message: "Meal plan deleted" });
  } catch (error) {
    console.error("[MEAL_PLAN] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
