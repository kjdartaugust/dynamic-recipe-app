import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/shopping-list -> get user's shopping lists
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Query error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ lists: data || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// POST /api/shopping-list -> create or update a shopping list
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, items, listId } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    if (listId) {
      const { data, error } = await supabase
        .from("shopping_lists")
        .update({
          title: title || "My Shopping List",
          items,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listId)
        .eq("user_id", session.user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: `Update error: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, list: data });
    }

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: session.user.id,
        title: title || "My Shopping List",
        items,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Insert error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// DELETE /api/shopping-list?listId=xxx -> delete a shopping list
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: `Delete error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
