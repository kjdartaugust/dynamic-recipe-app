import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ingredients } = body;

    let items;
    if (ingredients && Array.isArray(ingredients)) {
      items = ingredients;
    } else {
      // Fetch user's expiring items automatically
      const { data } = await supabase
        .from("fridge_items")
        .select("name, amount, unit")
        .eq("user_id", user.id)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true })
        .limit(10);
      items = data || [];
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No ingredients provided or found in fridge" },
        { status: 400 }
      );
    }

    const ingredientList = items
      .map((i: any) => `${i.amount || 1} ${i.unit || "piece"} ${i.name}`)
      .join("\n");

    const prompt = `Create a practical recipe using these ingredients that are about to expire. The goal is to reduce food waste.

Available ingredients:
${ingredientList}

Return ONLY a valid JSON object in this exact format:
{
  "title": "Recipe title",
  "description": "Brief description",
  "instructions": "Step-by-step cooking instructions",
  "prepTime": 15,
  "cookTime": 25,
  "servings": 4,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1.0,
      "unit": "cup"
    }
  ],
  "macros": {
    "calories": 350,
    "protein": 20,
    "carbs": 40,
    "fat": 12
  }
}

Rules:
- Use as many of the available ingredients as possible
- Keep the recipe practical for home cooking
- Use standard units: g, kg, ml, l, cup, tbsp, tsp, oz, lb, piece
- Include basic pantry staples (salt, oil, spices) if needed
- Return ONLY the JSON, no markdown, no explanations`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter error:", errorData);
      return NextResponse.json(
        { error: "AI service error", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    let recipe;
    try {
      recipe = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          recipe = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse recipe from AI response");
        }
      }
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("[RESCUE RECIPE] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
