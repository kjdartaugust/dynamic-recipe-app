import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const supabase = createAdminClient();
  const search = request.nextUrl.searchParams.get("q")?.trim();

  let query = supabase
    .from("profiles")
    .select("id, username, email, avatar_url, created_at, is_admin")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("[ADMIN USERS] Error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  // Recipe count per user, in one query rather than N.
  const { data: recipeRows } = await supabase.from("recipes").select("user_id");
  const recipeCounts = new Map<string, number>();
  for (const row of recipeRows ?? []) {
    recipeCounts.set(row.user_id, (recipeCounts.get(row.user_id) ?? 0) + 1);
  }

  return NextResponse.json({
    users: (profiles ?? []).map((p) => ({
      ...p,
      recipeCount: recipeCounts.get(p.id) ?? 0,
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  if (id === gate.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account here" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Refuse to delete other admins — demote them in SQL first. Stops one
  // compromised admin session from wiping out the rest.
  const { data: target } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", id)
    .single();

  if (target?.is_admin) {
    return NextResponse.json(
      { error: "Cannot delete another admin. Revoke is_admin first." },
      { status: 400 }
    );
  }

  // Cascades to profiles/recipes/fridge_items/etc. via ON DELETE CASCADE.
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    console.error("[ADMIN USERS] Delete failed:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
