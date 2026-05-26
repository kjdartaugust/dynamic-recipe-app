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

    // Fetch ratings without profiles join (RLS-safe)
    const { data: ratings, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[RATINGS GET] Error fetching ratings:", error);
      return NextResponse.json({ error: "Failed to fetch ratings", details: error.message }, { status: 500 });
    }

    // Fetch user profiles separately
    const userIds = [...new Set(ratings?.map((r) => r.user_id) || [])];
    let profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    }

    // Enrich ratings with profile data
    const enrichedRatings = (ratings || []).map((r) => ({
      ...r,
      profiles: profilesMap.get(r.user_id) || null,
    }));

    // Calculate average
    const avg =
      enrichedRatings.length > 0
        ? enrichedRatings.reduce((sum, r) => sum + r.rating, 0) / enrichedRatings.length
        : 0;

    return NextResponse.json({
      ratings: enrichedRatings,
      average: avg,
      count: enrichedRatings.length,
    });
  } catch (error) {
    console.error("[RATINGS GET] Unexpected error:", error);
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

    // Upsert rating
    const { error: upsertError } = await supabase
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

    if (upsertError) {
      console.error("[RATINGS POST] Error upserting:", upsertError);
      return NextResponse.json({ error: "Failed to save rating", details: upsertError.message }, { status: 500 });
    }

    // Fetch the saved rating
    const { data: savedRating, error: fetchError } = await supabase
      .from("ratings")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("[RATINGS POST] Error fetching saved rating:", fetchError);
      return NextResponse.json({ error: "Saved but failed to fetch", details: fetchError.message }, { status: 500 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      rating: {
        ...savedRating,
        profiles: profile || null,
      },
    });
  } catch (error) {
    console.error("[RATINGS POST] Unexpected error:", error);
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
      console.error("[RATINGS DELETE] Error:", error);
      return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
    }

    return NextResponse.json({ message: "Rating deleted" });
  } catch (error) {
    console.error("[RATINGS DELETE] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
