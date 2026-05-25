import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    configured: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.slice(0, 10) + "..." : null,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes("API") || k.includes("KEY") || k.includes("SUPABASE")
    ),
  });
}
