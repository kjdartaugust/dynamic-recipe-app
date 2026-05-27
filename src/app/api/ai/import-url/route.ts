import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page with realistic browser headers
    let pageText: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 403) {
          return NextResponse.json(
            { 
              error: "This website blocks recipe scraping", 
              details: "Many recipe sites (AllRecipes, NYT Cooking, etc.) block automated fetching. Try pasting the recipe text directly, or use a site with open access."
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: `Failed to fetch page: ${response.status}` },
          { status: 502 }
        );
      }

      const html = await response.text();
      pageText = stripHtml(html).slice(0, 15000); // Limit to 15k chars
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: "Failed to fetch recipe page", details: fetchError.message },
        { status: 502 }
      );
    }

    const prompt = `Extract the recipe from this webpage content. Return ONLY a valid JSON object.

Webpage content:
${pageText}

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
- Extract the actual recipe from the page content
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
      console.error("[IMPORT URL] OpenRouter error:", errorData);
      return NextResponse.json(
        { error: "AI service error" },
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

    // Validate minimum structure
    if (!recipe.title || recipe.title.trim() === "") {
      return NextResponse.json(
        { error: "No recipe found on this page" },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error: any) {
    console.error("[IMPORT URL] Error:", error);
    return NextResponse.json(
      { error: "Failed to import recipe", details: error.message },
      { status: 500 }
    );
  }
}
