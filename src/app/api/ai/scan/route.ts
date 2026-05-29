import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Rate limit: 5 requests per minute per IP
const rateLimiter = createRateLimiter(5, 60 * 1000);

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If rate limited or service unavailable, retry
      if (response.status === 429 || response.status === 503) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[SCAN] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Prompt for ingredient extraction
    const prompt = `
      Analyze this food image and identify all visible ingredients.
      
      Return ONLY a valid JSON object in this exact format:
      {
        "ingredients": [
          {
            "name": "ingredient name",
            "amount": 1,
            "unit": "piece"
          }
        ]
      }
      
      Rules:
      - Identify all distinct ingredients visible in the image
      - Use common cooking units: piece, g, kg, ml, l, cup, tbsp, tsp, oz, lb
      - Estimate reasonable amounts based on typical usage
      - If uncertain about amount, use "1" and unit "piece"
      - Return ONLY the JSON, no markdown, no explanations
    `;

    const response = await fetchWithRetry(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: imageFile.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SCAN] Gemini error:", errorData);

      // Check if it's a rate limit or quota issue
      if (response.status === 429 || response.status === 503) {
        return NextResponse.json(
          {
            error: "AI is currently busy",
            details: "Google's AI service is experiencing high demand. Please try again in a moment.",
            retryable: true,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "AI service error", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    let ingredients;
    try {
      // Try to parse the entire response as JSON
      ingredients = JSON.parse(text);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON between curly braces
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          ingredients = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse ingredients from AI response");
        }
      }
    }

    // Validate the response structure
    if (!ingredients.ingredients || !Array.isArray(ingredients.ingredients)) {
      throw new Error("Invalid response structure from AI");
    }

    return NextResponse.json({
      success: true,
      ingredients: ingredients.ingredients,
    });
  } catch (error) {
    console.error("Error scanning image:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
