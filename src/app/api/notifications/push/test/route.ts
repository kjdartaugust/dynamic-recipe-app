import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { webpush, isPushConfigured } from "@/lib/web-push";

export async function POST(req: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push not configured on server. VAPID_PRIVATE_KEY or VAPID_SUBJECT missing." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id)
      .limit(1);

    if (subError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No push subscription found. Enable push notifications in your profile first." },
        { status: 404 }
      );
    }

    const sub = subscriptions[0];
    const payload = JSON.stringify({
      title: "🔔 Test Notification",
      body: "Push notifications are working!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "test-notification",
      data: { url: "/fridge" },
    });

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      payload
    );

    return NextResponse.json({ success: true, sent: 1 });
  } catch (error: any) {
    console.error("[PUSH TEST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test notification" },
      { status: 500 }
    );
  }
}
