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
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Recipe text is required (minimum 20 characters)" },
        { status: 400 }
      );
    }

    const prompt = `Extract the recipe from this text and return ONLY a valid JSON object.

Recipe text:
${text.trim().slice(0, 10000)}

Return ONLY a valid JSON object in this exact format:
{
  "title": "Recipe Title",
  "description": "Brief description of the dish",
  "instructions": "Step 1. Do this.\\nStep 2. Do that.\\nStep 3. Finish.",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "Easy",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1.5,
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
- Extract the actual recipe from the text
- If no recipe found, return ingredients: [] and empty title
- Use standard units: g, kg, ml, l, cup, tbsp, tsp, oz, lb, piece
- Instructions should be numbered steps separated by newlines
- prepTime and cookTime are in minutes
- difficulty must be one of: Easy, Medium, Hard
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
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[IMPORT TEXT] OpenRouter error:", errorData);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "";

    let recipe;
    try {
      recipe = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = aiText.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          recipe = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse recipe from AI response");
        }
      }
    }

    // Validate minimum structure
    if (!recipe.title || recipe.title.trim() === "") {
      return NextResponse.json(
        { error: "Could not find a recipe in the provided text" },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error: any) {
    console.error("[IMPORT TEXT] Error:", error);
    return NextResponse.json(
      { error: "Failed to import recipe", details: error.message },
      { status: 500 }
    );
  }
}
