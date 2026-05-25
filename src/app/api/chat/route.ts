import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Diagnostic: check if key exists (don't log the full key)
    if (!apiKey) {
      console.error("[CHAT] GEMINI_API_KEY is missing");
      return NextResponse.json(
        { error: "Server config error: GEMINI_API_KEY not set" },
        { status: 503 }
      );
    }
    
    console.log("[CHAT] API key present, length:", apiKey.length);

    const body = await request.json();
    const { messages, recipeContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const systemPrompt = `You are a helpful cooking and recipe assistant. You help users with:
- Cooking techniques and tips
- Ingredient substitutions
- Recipe modifications and scaling
- Food safety and storage
- Nutritional information
- Meal planning suggestions

Guidelines:
- Keep responses concise and practical
- If suggesting substitutions, explain why they work
- Always prioritize food safety
- If unsure about something, say so rather than guessing
- Use friendly, encouraging tone
- Format ingredients and steps clearly with bullet points when helpful

${recipeContext ? `Current recipe context:\n${recipeContext}` : ""}`;

    console.log("[CHAT] Calling OpenRouter with", messages.length, "messages");

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

    console.log("[CHAT] OpenRouter response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CHAT] OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status} - ${errorText.slice(0, 200)}` },
        { status: 503 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("[CHAT] No reply in response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "No response content from AI" }, { status: 500 });
    }

    console.log("[CHAT] Success, reply length:", reply.length);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[CHAT] Unexpected error:", error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
