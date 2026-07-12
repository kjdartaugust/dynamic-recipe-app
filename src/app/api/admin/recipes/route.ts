import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireServiceRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// Public recipes, newest first — the moderation queue for /explore.
export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const missing = requireServiceRole();
  if (missing) return missing;

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
    return NextResponse.json(
      { error: `Recipes query failed: ${error.message}` },
      { status: 500 }
    );
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
//
// Takedown-only by construction: is_public is hardcoded to false rather than
// taken from the request. An admin must not be able to *publish* someone's
// private recipe, and an `is_public` flag in the body would allow exactly
// that. The `.eq("is_public", true)` guard also means this can only ever act
// on something already public.
export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const missing = requireServiceRole();
  if (missing) return missing;

  const body = await request.json();
  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recipes")
    .update({ is_public: false })
    .eq("id", id)
    .eq("is_public", true)
    .select("id");

  if (error) {
    console.error("[ADMIN RECIPES] Unpublish failed:", error);
    return NextResponse.json({ error: "Failed to unpublish recipe" }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json(
      { error: "Recipe not found or already private" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
