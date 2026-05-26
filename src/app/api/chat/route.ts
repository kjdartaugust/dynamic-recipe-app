import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error("[CHAT] OPENROUTER_API_KEY is missing");
      return NextResponse.json(
        { error: "Server config error: OPENROUTER_API_KEY not set" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, recipeContext, fridgeContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // Build system prompt with all available context
    let contextSections = [];
    
    if (fridgeContext && fridgeContext.length > 0) {
      contextSections.push(`User's Fridge/Pantry:\n${fridgeContext}`);
    }
    
    if (recipeContext) {
      contextSections.push(`Current Recipe Context:\n${recipeContext}`);
    }

    const systemPrompt = `You are ZeroWaste Chef, a helpful cooking assistant focused on reducing food waste. Your mission is to help users cook with what they have before ingredients go bad.

${contextSections.length > 0 ? contextSections.join("\n\n") + "\n\n" : ""}Your core abilities:
- Suggest recipes using ingredients the user already has (especially expiring ones)
- Recommend substitutions based on available ingredients
- Teach cooking techniques and food preservation methods
- Provide clear, practical advice to prevent food waste
- Help scale recipes up or down

Guidelines:
- ALWAYS prioritize using existing fridge ingredients when possible
- If user has expiring items, suggest recipes that use them first
- Keep responses concise and actionable
- If suggesting substitutions, explain why they work
- Prioritize food safety — never suggest using spoiled food
- Use friendly, encouraging tone
- Format ingredients and steps clearly with bullet points when helpful
- If the user doesn't specify ingredients, proactively ask what's in their fridge`;

    console.log("[CHAT] Calling OpenRouter with fridge context:", !!fridgeContext, "recipe context:", !!recipeContext);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dynamic-recipe-app.vercel.app",
        "X-Title": "Dynamic Recipe App",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CHAT] OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 503 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({ error: "No response content from AI" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[CHAT] Unexpected error:", error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
