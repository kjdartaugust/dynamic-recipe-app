import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "anonymous";
    const path = request.nextUrl.pathname;
    const key = `${ip}:${path}`;
    
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetTime < now) {
      // First request or window expired
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null;
    }

    if (entry.count >= maxRequests) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again in ${Math.ceil(
            (entry.resetTime - now) / 1000
          )} seconds.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(entry.resetTime),
          },
        }
      );
    }

    entry.count++;
    return null;
  };
}
