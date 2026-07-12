import "server-only";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase-admin";

// A guest gets a small free trial to hook them into signing up; a signed-in
// user gets a ceiling high enough never to notice, low enough that a runaway
// script or a stolen session can't bankrupt us on Groq tokens.
export const GUEST_LIMIT = 5;
export const GUEST_WINDOW_HOURS = 24;

export const USER_LIMIT = 60;
export const USER_WINDOW_HOURS = 1;

export interface Quota {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
  /** Set when the quota could not be evaluated at all (misconfig / outage). */
  unavailable?: boolean;
  /** Row to refund if the request never produced an answer. */
  usageId?: string;
}

/**
 * Hand a message back after an upstream failure.
 *
 * The quota is spent *before* calling Groq — deliberately, so a caller can't
 * mine free tokens by forcing errors. The cost is that a Groq outage would
 * otherwise burn one of a guest's five trial messages for nothing, so we
 * return it when we know no answer was produced.
 */
export async function refundChatQuota(usageId: string | undefined): Promise<void> {
  if (!usageId || !isAdminClientConfigured()) return;
  try {
    await createAdminClient().from("chat_usage").delete().eq("id", usageId);
  } catch (error) {
    // A failed refund costs the user one message; it must never mask the
    // upstream error that actually broke their request.
    console.error("[CHAT] Quota refund failed:", error);
  }
}

/**
 * Stable identity for a guest, without retaining their IP.
 *
 * Hashing is salted so the table can't be brute-forced back to raw addresses
 * (the IPv4 space is small enough to enumerate against an unsalted hash).
 */
function guestIdentity(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const salt = process.env.CHAT_IP_SALT ?? "";
  const hash = createHash("sha256").update(`${salt}:${ip}`).digest("hex");
  return `ip:${hash}`;
}

export function identityFor(request: NextRequest, userId: string | null): string {
  return userId ? `user:${userId}` : guestIdentity(request);
}

/**
 * Count this identity's messages in the window and record the new one.
 *
 * Durable on purpose: rate-limit.ts keeps its counters in an in-memory Map,
 * which on serverless means one counter per instance — an attacker just
 * spreads requests across instances. A quota that can be sidestepped by
 * reconnecting isn't a quota.
 */
export async function consumeChatQuota(
  request: NextRequest,
  userId: string | null
): Promise<Quota> {
  const identity = identityFor(request, userId);
  const limit = userId ? USER_LIMIT : GUEST_LIMIT;
  const windowHours = userId ? USER_WINDOW_HOURS : GUEST_WINDOW_HOURS;

  // Without the service-role key we cannot read or write the quota table, and
  // an unmetered chat endpoint is exactly the thing we're fixing. Refuse, and
  // say so plainly rather than dying with an opaque 500.
  if (!isAdminClientConfigured()) {
    console.error("[CHAT] SUPABASE_SERVICE_ROLE_KEY missing — cannot meter chat");
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds: 60,
      unavailable: true,
    };
  }

  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - windowHours * 3600_000).toISOString();

  const { count, error } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("identity", identity)
    .gte("created_at", windowStart);

  // Fail closed. If we can't prove the caller is under quota, we don't spend
  // tokens on them — the alternative is that a database blip turns the
  // endpoint back into an open proxy.
  if (error) {
    console.error("[CHAT] Quota lookup failed:", error);
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds: 60,
      unavailable: true,
    };
  }

  const used = count ?? 0;
  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds: windowHours * 3600,
    };
  }

  const { data: inserted } = await supabase
    .from("chat_usage")
    .insert({ identity })
    .select("id")
    .single();

  // Opportunistic prune. Rows are only ever read inside the window, so older
  // ones are dead weight — without this the table grows forever.
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString();
    await supabase.from("chat_usage").delete().lt("created_at", cutoff);
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - used - 1),
    limit,
    retryAfterSeconds: 0,
    usageId: inserted?.id,
  };
}
