import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// Public recipes, newest first — the moderation queue for /explore.
export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const supabase = createAdminClient();
  const search = request.nextUrl.searchParams.get("q")?.trim();

  let query = supabase
    .from("recipes")
    .select("id, title, description, image_url, is_public, created_at, user_id")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: recipes, error } = await query;

  if (error) {
    console.error("[ADMIN RECIPES] Error:", error);
    return NextResponse.json({ error: "Failed to load recipes" }, { status: 500 });
  }

  const authorIds = [...new Set((recipes ?? []).map((r) => r.user_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", authorIds.length ? authorIds : ["00000000-0000-0000-0000-000000000000"]);

  const authorNames = new Map((authors ?? []).map((a) => [a.id, a.username]));

  return NextResponse.json({
    recipes: (recipes ?? []).map((r) => ({
      ...r,
      author: authorNames.get(r.user_id) ?? "unknown",
    })),
  });
}

// Take a recipe down from /explore. Unpublishes rather than deletes, so the
// author keeps their content.
export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { id, is_public } = body;

  if (!id || typeof is_public !== "boolean") {
    return NextResponse.json(
      { error: "id and is_public are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("recipes")
    .update({ is_public })
    .eq("id", id);

  if (error) {
    console.error("[ADMIN RECIPES] Update failed:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
