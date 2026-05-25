import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service not configured. Please set GEMINI_API_KEY in environment variables." },
        { status: 503 }
      );
    }

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
      console.error("OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI service error (${response.status}). Please try again.` },
        { status: 503 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
