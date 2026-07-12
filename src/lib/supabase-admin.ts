import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS and can call auth.admin.*.
//
// Two things depend on this and cannot work without it:
//   * the notification crons, which run with no logged-in user, so under
//     the anon key `auth.uid()` is null and RLS matches zero rows;
//   * account deletion and the admin user list, which need auth.admin.*.
//
// The key must never reach the browser. `server-only` makes importing this
// from a Client Component a *build* error rather than a runtime surprise.

export function isAdminClientConfigured(): boolean {
  return (
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

/**
 * Which Postgres role SUPABASE_SERVICE_ROLE_KEY actually resolves to.
 *
 * Pasting the *anon* key here is an easy mistake — the two sit side by side
 * in the Supabase dashboard and both look like `eyJ...`. The symptom is
 * baffling: the key is "present", so nothing reports it as missing, but
 * every query dies with `permission denied for table ...` because it is
 * silently running as `anon`.
 *
 * Reads only the `role` claim from the JWT payload. Returns null for the
 * newer non-JWT `sb_secret_...` keys, which we cannot introspect.
 */
export function detectServiceRoleKeyRole(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  const parts = key.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are not configured"
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
