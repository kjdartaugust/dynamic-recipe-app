import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Delete user data from profiles table first
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("[DELETE] Error deleting profile:", profileError);
      // Continue anyway - try to delete auth user
    }

    // Delete user's recipes (cascade will handle ingredients, favorites, etc.)
    const { error: recipesError } = await supabase
      .from("recipes")
      .delete()
      .eq("user_id", user.id);

    if (recipesError) {
      console.error("[DELETE] Error deleting recipes:", recipesError);
    }

    // Delete user's shopping list
    const { error: shoppingError } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("user_id", user.id);

    if (shoppingError) {
      console.error("[DELETE] Error deleting shopping list:", shoppingError);
    }

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

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
