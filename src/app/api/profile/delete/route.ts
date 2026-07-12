import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // auth.admin.deleteUser requires service_role — on the anon key it fails
    // with not_admin, which is why account deletion never actually worked.
    if (!isAdminClientConfigured()) {
      return NextResponse.json(
        { error: "Account deletion is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 }
      );
    }

    // Delete the auth user and let Postgres cascade do the rest.
    //
    // This used to hand-delete profiles/recipes/shopping_lists first, merely
    // logging any failures, and only then delete the auth user. If that last
    // call failed the account was left in a partially destroyed state: still
    // able to sign in, but with its content already irreversibly gone.
    //
    // Every user-owned table is ON DELETE CASCADE back to auth.users (either
    // directly, or via profiles.id), so one statement removes everything
    // atomically — and if it fails, nothing is destroyed.
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[DELETE] Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("[DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
