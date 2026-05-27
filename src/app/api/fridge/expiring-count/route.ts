import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await supabase
      .from("fridge_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("expiry_date", threeDaysStr)
      .gte("expiry_date", today);

    if (error) {
      console.error("[FRIDGE COUNT] Error:", error);
      return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("[FRIDGE COUNT] Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
