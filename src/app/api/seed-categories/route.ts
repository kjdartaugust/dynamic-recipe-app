import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if categories already exist
    const { data: existing, error: countError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check categories", details: countError.message },
        { status: 500 }
      );
    }

    // If categories exist, return early (idempotent)
    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Categories already seeded",
        seeded: false,
      });
    }

    // Insert all default categories
    const { data, error } = await supabase
      .from("categories")
      .insert(DEFAULT_CATEGORIES)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to seed categories", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${data.length} categories`,
      seeded: true,
      categories: data,
    });
  } catch (error) {
    console.error("Error seeding categories:", error);
    return NextResponse.json(
      {
        error: "Failed to seed categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
