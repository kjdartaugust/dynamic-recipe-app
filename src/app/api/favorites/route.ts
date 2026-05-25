import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: `Session error: ${sessionError.message}` }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (recipeId) {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("recipe_id", recipeId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: `Query error: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ isFavorited: !!data });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("recipe_id")
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: `Query error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ favorites: data?.map((f) => f.recipe_id) || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: `Session error: ${sessionError.message}` }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: session.user.id, recipe_id: recipeId });

    if (error) {
      return NextResponse.json({ error: `Insert error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: `Session error: ${sessionError.message}` }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", session.user.id)
      .eq("recipe_id", recipeId);

    if (error) {
      return NextResponse.json({ error: `Delete error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
