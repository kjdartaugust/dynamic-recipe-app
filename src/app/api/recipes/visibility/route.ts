import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, isPublic } = body;

    if (!recipeId || typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "recipeId and isPublic are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("recipes")
      .select("id, user_id")
      .eq("id", recipeId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this recipe" },
        { status: 403 }
      );
    }

    const { data: recipe, error } = await supabase
      .from("recipes")
      .update({ is_public: isPublic })
      .eq("id", recipeId)
      .select()
      .single();

    if (error) {
      console.error("[RECIPE VISIBILITY] Error:", error);
      return NextResponse.json(
        { error: "Failed to update visibility" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("[RECIPE VISIBILITY] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
