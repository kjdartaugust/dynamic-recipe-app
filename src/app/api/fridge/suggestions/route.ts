import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function GET(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's fridge items
    const { data: items } = await supabase
      .from("fridge_items")
      .select("name, amount, unit, expiry_date")
      .eq("user_id", user.id)
      .order("expiry_date", { ascending: true })
      .limit(15);

    if (!items || items.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const ingredientList = items
      .map((i: any) => `${i.amount || 1} ${i.unit || "piece"} ${i.name}`)
      .join("\n");

    const prompt = `Given these ingredients from someone's kitchen:

${ingredientList}

Generate 4 recipe suggestions that creatively use these ingredients. Some should prioritize items expiring soon. Be inventive but practical.

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Recipe Title",
    "description": "One sentence about what it is",
    "usesIngredients": ["ingredient1", "ingredient2"],
    "allIngredients": [
      {"name": "ingredient", "amount": 1, "unit": "cup"}
    ],
    "prepTime": 15,
    "cookTime": 20,
    "servings": 4,
    "difficulty": "Easy",
    "tags": ["tag1", "tag2"],
    "imagePrompt": "professional food photography of recipe name on rustic plate, warm lighting, overhead shot"
  }
]

Rules:
- Difficulty must be one of: Easy, Medium, Hard
- Include ONLY ingredients the user has or basic pantry items
- Be creative with combinations
- Return ONLY valid JSON, no markdown or explanations`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[AI SUGGESTIONS] Groq error:", errorData);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = text.match(/\[[\s\S]*\]/);
        if (braceMatch) {
          suggestions = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse suggestions");
        }
      }
    }

    // Add AI image URLs using pollinations.ai
    const suggestionsWithImages = suggestions.map((s: any) => ({
      ...s,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(s.imagePrompt)}?width=400&height=300&seed=${Math.floor(Math.random() * 10000)}&nologo=true`,
    }));

    return NextResponse.json({ suggestions: suggestionsWithImages });
  } catch (error) {
    console.error("[AI SUGGESTIONS] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
