import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: ratings, error } = await supabase
      .from("ratings")
      .select("*, profiles(username, avatar_url)")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[RATINGS] Error fetching:", error);
      return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
    }

    // Calculate average
    const avg =
      ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return NextResponse.json({ ratings: ratings || [], average: avg, count: ratings?.length || 0 });
  } catch (error) {
    console.error("[RATINGS] Unexpected error:", error);
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
    const { recipeId, rating, review } = body;

    if (!recipeId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "recipeId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Upsert rating (insert or update)
    const { error } = await supabase
      .from("ratings")
      .upsert(
        {
          recipe_id: recipeId,
          user_id: user.id,
          rating,
          review: review || null,
        },
        {
          onConflict: "recipe_id,user_id",
        }
      );

    if (error) {
      console.error("[RATINGS] Error saving:", error);
      return NextResponse.json({ error: "Failed to save rating", details: error.message }, { status: 500 });
    }

    // Fetch the saved rating with profile info
    const { data, error: fetchError } = await supabase
      .from("ratings")
      .select("*, profiles(username, avatar_url)")
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("[RATINGS] Error fetching saved rating:", fetchError);
      return NextResponse.json({ error: "Saved but failed to refresh" }, { status: 500 });
    }

    return NextResponse.json({ rating: data });
  } catch (error) {
    console.error("[RATINGS] Unexpected error:", error);
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
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[RATINGS] Error deleting:", error);
      return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
    }

    return NextResponse.json({ message: "Rating deleted" });
  } catch (error) {
    console.error("[RATINGS] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
