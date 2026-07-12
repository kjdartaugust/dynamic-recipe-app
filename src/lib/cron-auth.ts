import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Vercel Cron invokes the endpoint with a GET and
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * The previous implementation checked a custom `x-cron-secret` header on a
 * POST handler, which meant the scheduler's own requests were rejected (405,
 * and then 401 even if the method had matched).
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
