import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export interface AdminUser {
  id: string;
  email: string | undefined;
}

type AdminGate =
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse };

/**
 * Gate for every /api/admin/* route.
 *
 * Reads is_admin from the caller's own profile row using the *user-scoped*
 * client, so the check is bound to their session cookie. is_admin is not
 * writable by the authenticated role (see migration 013), so a user cannot
 * grant it to themselves.
 *
 * Returns 404 rather than 403 for non-admins so the admin surface isn't
 * discoverable by probing.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { ok: true, user: { id: user.id, email: user.email } };
}
