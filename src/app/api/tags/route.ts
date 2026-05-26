import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/tags?recipeId=xxx -> get tags for a recipe
// GET /api/tags -> get all tags
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (recipeId) {
      const { data: recipeTags, error } = await supabase
        .from("recipe_tags")
        .select("tags(id, name, slug)")
        .eq("recipe_id", recipeId);

      if (error) {
        return NextResponse.json({ error: `Query error: ${error.message}` }, { status: 500 });
      }

      const tags = recipeTags?.map((rt: any) => rt.tags) || [];
      return NextResponse.json({ tags });
    }

    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug")
      .order("name");

    if (error) {
      return NextResponse.json({ error: `Query error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ tags: data || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// POST /api/tags -> add tags to a recipe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId, tagNames } = await request.json();

    if (!recipeId || !tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
      return NextResponse.json({ error: "Recipe ID and tag names are required" }, { status: 400 });
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("user_id")
      .eq("id", recipeId)
      .single();

    if (recipeError || !recipe || recipe.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this recipe" }, { status: 403 });
    }

    const insertedTagIds: string[] = [];

    for (const tagName of tagNames) {
      const normalizedName = tagName.trim().toLowerCase();
      if (!normalizedName) continue;

      const slug = normalizedName.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      let tagId: string;

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({ name: tagName.trim(), slug })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating tag:", createError);
          continue;
        }
        tagId = newTag.id;
      }

      insertedTagIds.push(tagId);
    }

    if (insertedTagIds.length > 0) {
      const junctionEntries = insertedTagIds.map((tagId) => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }));

      const { error: junctionError } = await supabase
        .from("recipe_tags")
        .insert(junctionEntries);

      if (junctionError && !junctionError.message.includes("duplicate key")) {
        return NextResponse.json({ error: `Link error: ${junctionError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, tagsAdded: insertedTagIds.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// DELETE /api/tags?recipeId=xxx&tagId=xxx -> remove a tag from a recipe
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");
    const tagId = searchParams.get("tagId");

    if (!recipeId || !tagId) {
      return NextResponse.json({ error: "Recipe ID and tag ID are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("recipe_tags")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("tag_id", tagId);

    if (error) {
      return NextResponse.json({ error: `Delete error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
