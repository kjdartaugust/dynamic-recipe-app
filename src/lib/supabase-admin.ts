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
