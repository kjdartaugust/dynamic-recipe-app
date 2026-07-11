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

  const results = await Promise.all([
    headCount("profiles"),
    headCount("profiles").gte("created_at", sinceStr),
    headCount("recipes"),
    headCount("recipes").eq("is_public", true),
    headCount("fridge_items"),
    headCount("ratings"),
    headCount("collections"),
  ]);

  // Surface failures rather than coercing them to 0 — otherwise a missing
  // migration or a database outage renders as a dashboard full of zeroes,
  // which is indistinguishable from a legitimately empty app.
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error("[ADMIN METRICS] Count query failed:", failed.error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }

  const [users, newUsers, recipes, publicRecipes, fridgeItems, ratings, collections] =
    results.map((r) => r.count ?? 0);

  return NextResponse.json({
    users,
    newUsersLast30Days: newUsers,
    recipes,
    publicRecipes,
    privateRecipes: recipes - publicRecipes,
    fridgeItems,
    ratings,
    collections,
  });
}
