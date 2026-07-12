import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isAdminClientConfigured, detectServiceRoleKeyRole } from "@/lib/supabase-admin";

export const SERVICE_ROLE_MISSING =
  "SUPABASE_SERVICE_ROLE_KEY is not set for this environment. Add it in Vercel → " +
  "Settings → Environment Variables (tick Preview as well as Production), then " +
  "redeploy — env vars are baked in at build time.";

/**
 * Every admin route needs the service-role client. Without this check,
 * createAdminClient() throws and the caller sees an opaque 500 with no hint
 * that a single missing env var is the cause.
 *
 * The wrong-key case is nastier than the missing-key case: the anon key sits
 * next to the service_role key in the Supabase dashboard and looks identical,
 * and pasting it here yields `permission denied for table ...` on every query
 * rather than anything that points at the key. So we check the role claim and
 * name the problem.
 */
export function requireServiceRole(): NextResponse | null {
  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: SERVICE_ROLE_MISSING }, { status: 503 });
  }

  const role = detectServiceRoleKeyRole();
  if (role !== null && role !== "service_role") {
    return NextResponse.json(
      {
        error:
          `SUPABASE_SERVICE_ROLE_KEY holds a "${role}" key, not the service_role key. ` +
          `Every query will fail with "permission denied". In Supabase → Settings → API, ` +
          `use the key labelled service_role (secret, behind a Reveal button) — not the ` +
          `anon public key next to it.`,
      },
      { status: 503 }
    );
  }

  return null;
}

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
