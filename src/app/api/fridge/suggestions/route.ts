import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";
const UNSPLASH_URL = "https://api.unsplash.com/search/photos";

// Fetch a food photo from Unsplash based on recipe title
async function getUnsplashImage(title: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("[UNSPLASH] No access key configured");
    return null;
  }

  try {
    const query = encodeURIComponent(`${title} food`);
    const url = `${UNSPLASH_URL}?query=${query}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      console.error("[UNSPLASH] API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Use the regular image URL (1080px wide, high quality)
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error("[UNSPLASH] Error fetching image:", error);
    return null;
  }
}

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
    "tags": ["tag1", "tag2"]
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

    // Fetch real food photos from Unsplash for each suggestion
    const suggestionsWithImages = await Promise.all(
      suggestions.map(async (s: any) => {
        const imageUrl = await getUnsplashImage(s.title);
        return {
          ...s,
          imageUrl,
        };
      })
    );

    return NextResponse.json({ suggestions: suggestionsWithImages });
  } catch (error) {
    console.error("[AI SUGGESTIONS] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
