import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { webpush, isPushConfigured } from "@/lib/web-push";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all users with push notifications enabled
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, push_notifications, notify_before_days")
      .eq("push_notifications", true);

    if (profileError || !profiles?.length) {
      return NextResponse.json({ sent: 0, error: profileError?.message || "No users" });
    }

    const results = [];

    for (const profile of profiles) {
      // Get expiring items for this user
      const today = new Date().toISOString().split("T")[0];
      const notifyBefore = profile.notify_before_days || 3;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + notifyBefore);
      const cutoffStr = cutoff.toISOString().split("T")[0];

      const { data: items } = await supabase
        .from("fridge_items")
        .select("name, expiry_date")
        .eq("user_id", profile.id)
        .lte("expiry_date", cutoffStr)
        .gte("expiry_date", today)
        .order("expiry_date", { ascending: true });

      if (!items?.length) continue;

      // Get push subscriptions for this user
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", profile.id);

      if (!subscriptions?.length) continue;

      const itemList = items.map((item) => {
        const days = getDaysUntilExpiry(item.expiry_date);
        const dayText = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        return `${item.name} — expires ${dayText}`;
      });

      const payload = JSON.stringify({
        title: `🔔 ${items.length} item${items.length > 1 ? "s" : ""} expiring soon!`,
        body: itemList.join("\n"),
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "expiry-alert",
        actions: [
          { action: "open-fridge", title: "View Fridge" },
          { action: "dismiss", title: "Dismiss" },
        ],
        data: {
          url: "/fridge",
        },
      });

      for (const sub of subscriptions) {
        try {
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
          results.push({ user: profile.id, endpoint: sub.endpoint.slice(0, 50), status: "sent" });
        } catch (err: any) {
          // If the subscription is invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            results.push({ user: profile.id, endpoint: sub.endpoint.slice(0, 50), status: "removed" });
          } else {
            results.push({ user: profile.id, endpoint: sub.endpoint.slice(0, 50), status: "error", error: err.message });
          }
        }
      }
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "sent").length,
      removed: results.filter((r) => r.status === "removed").length,
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[NOTIFY PUSH] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
