import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { recipe, modifiers } = body;

    if (!recipe || !modifiers) {
      return NextResponse.json(
        { error: "Recipe and modifiers are required" },
        { status: 400 }
      );
    }

    const prompt = `
      You are a recipe modification assistant. Modify the given recipe according to the user's instructions.

      Original Recipe:
      ${recipe}

      Modification Request: ${modifiers}

      Return ONLY a valid JSON object in this exact format:
      {
        "title": "Modified recipe title",
        "description": "Brief description of the modified recipe",
        "instructions": "Step-by-step instructions for the modified recipe",
        "ingredients": [
          {
            "name": "ingredient name",
            "amount": 1.0,
            "unit": "unit of measurement"
          }
        ],
        "macros": {
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0
        }
      }

      Rules:
      - Adjust all ingredient quantities proportionally if scaling
      - Substitute ingredients appropriately for dietary modifications (vegan, gluten-free, etc.)
      - Recalculate instructions to reflect changes
      - Estimate macronutrients based on modified ingredients
      - Use standard units: g, kg, ml, l, cup, tbsp, tsp, oz, lb, piece
      - Return ONLY the JSON, no markdown, no explanations
    `;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq error:", errorData);
      return NextResponse.json(
        { error: "AI service error", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let modifiedRecipe;
    try {
      modifiedRecipe = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        modifiedRecipe = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          modifiedRecipe = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse modified recipe from AI response");
        }
      }
    }

    // Validate required fields
    const requiredFields = ["title", "instructions", "ingredients", "macros"];
    for (const field of requiredFields) {
      if (!modifiedRecipe[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return NextResponse.json({
      success: true,
      recipe: modifiedRecipe,
    });
  } catch (error) {
    console.error("Error modifying recipe:", error);
    return NextResponse.json(
      {
        error: "Failed to modify recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
