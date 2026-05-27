import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipe_id } = body;

    if (!recipe_id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    // Get current max position
    const { data: existing } = await supabase
      .from("collection_recipes")
      .select("position")
      .eq("collection_id", collectionId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { data: item, error } = await supabase
      .from("collection_recipes")
      .insert({
        collection_id: collectionId,
        recipe_id,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Recipe already in collection" }, { status: 409 });
      }
      console.error("[COLLECTION RECIPES POST] Error:", error);
      return NextResponse.json({ error: "Failed to add recipe" }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[COLLECTION RECIPES POST] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("collection_recipes")
      .delete()
      .eq("collection_id", collectionId)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("[COLLECTION RECIPES DELETE] Error:", error);
      return NextResponse.json({ error: "Failed to remove recipe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COLLECTION RECIPES DELETE] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipe_positions } = body;

    if (!Array.isArray(recipe_positions)) {
      return NextResponse.json({ error: "recipe_positions array required" }, { status: 400 });
    }

    // Update positions in batch
    const updates = recipe_positions.map(({ recipe_id, position }: { recipe_id: string; position: number }) =>
      supabase
        .from("collection_recipes")
        .update({ position })
        .eq("collection_id", collectionId)
        .eq("recipe_id", recipe_id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COLLECTION RECIPES PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
