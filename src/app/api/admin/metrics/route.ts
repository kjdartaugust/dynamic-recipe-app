import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const supabase = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();

  const headCount = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [
    users,
    newUsers,
    recipes,
    publicRecipes,
    fridgeItems,
    ratings,
    collections,
  ] = await Promise.all([
    headCount("profiles"),
    headCount("profiles").gte("created_at", sinceStr),
    headCount("recipes"),
    headCount("recipes").eq("is_public", true),
    headCount("fridge_items"),
    headCount("ratings"),
    headCount("collections"),
  ]);

  const total = recipes.count ?? 0;
  const shared = publicRecipes.count ?? 0;

  return NextResponse.json({
    users: users.count ?? 0,
    newUsersLast30Days: newUsers.count ?? 0,
    recipes: total,
    publicRecipes: shared,
    privateRecipes: total - shared,
    fridgeItems: fridgeItems.count ?? 0,
    ratings: ratings.count ?? 0,
    collections: collections.count ?? 0,
  });
}
