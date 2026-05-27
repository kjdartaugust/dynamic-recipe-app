import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Fetch recipes in collection with their details
    const { data: recipes, error: recipesError } = await supabase
      .from("collection_recipes")
      .select(`
        position,
        recipes:recipe_id (
          id,
          title,
          description,
          prep_time,
          cook_time,
          servings,
          difficulty,
          image_url,
          is_public,
          created_at,
          profiles (username)
        )
      `)
      .eq("collection_id", id)
      .order("position", { ascending: true });

    if (recipesError) {
      console.error("[COLLECTION GET] Recipes error:", recipesError);
    }

    return NextResponse.json({
      collection,
      recipes: recipes?.map((r) => ({
        ...r.recipes,
        position: r.position,
      })) || [],
    });
  } catch (error) {
    console.error("[COLLECTION GET] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, cover_image } = body;

    const updates: Record<string, string | null> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (cover_image !== undefined) updates.cover_image = cover_image || null;

    const { data: collection, error } = await supabase
      .from("collections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[COLLECTION PATCH] Error:", error);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("[COLLECTION PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[COLLECTION DELETE] Error:", error);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COLLECTION DELETE] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
