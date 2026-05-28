import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CreateRecipeForm from "./form";

const DEFAULT_CATEGORIES = [
  { name: "Breakfast", slug: "breakfast", description: "Morning meals and breakfast recipes" },
  { name: "Lunch", slug: "lunch", description: "Midday meals and lunch ideas" },
  { name: "Dinner", slug: "dinner", description: "Evening meals and dinner recipes" },
  { name: "Dessert", slug: "dessert", description: "Sweet treats and desserts" },
  { name: "Snack", slug: "snack", description: "Quick bites and snacks" },
  { name: "Drink", slug: "drink", description: "Beverages and drinks" },
  { name: "Salad", slug: "salad", description: "Fresh salads and greens" },
  { name: "Soup", slug: "soup", description: "Warm soups and stews" },
];

async function ensureCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .limit(1);

  if (!existing || existing.length === 0) {
    await supabase.from("categories").insert(DEFAULT_CATEGORIES);
  }
}

export default async function CreateRecipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure categories exist
  await ensureCategories(supabase);

  return <CreateRecipeForm userId={user.id} />;
}
