import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase-admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { webpush, isPushConfigured } from "@/lib/web-push";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Vercel Cron sends a GET with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 }
    );
  }

  // Service role: with no logged-in user, RLS on fridge_items and
  // push_subscriptions (`user_id = auth.uid()`) matches zero rows.
  const supabase = createAdminClient();
  const results: Array<{ user: string; status: string }> = [];

  try {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, notify_before_days")
      .eq("push_notifications", true);

    if (profileError) throw profileError;

    for (const profile of profiles ?? []) {
      const today = new Date().toISOString().split("T")[0];
      const notifyBefore = profile.notify_before_days || 3;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + notifyBefore);
      const cutoffStr = cutoff.toISOString().split("T")[0];

      // A failed query must not be mistaken for "this user has nothing
      // expiring" — that would let a database outage record as a clean run.
      const { data: items, error: itemsError } = await supabase
        .from("fridge_items")
        .select("name, expiry_date")
        .eq("user_id", profile.id)
        .lte("expiry_date", cutoffStr)
        .gte("expiry_date", today)
        .order("expiry_date", { ascending: true });

      if (itemsError) {
        results.push({ user: profile.id, status: "error" });
        continue;
      }
      if (!items?.length) continue;

      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", profile.id);

      if (subsError) {
        results.push({ user: profile.id, status: "error" });
        continue;
      }
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
        data: { url: "/fridge" },
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          results.push({ user: profile.id, status: "sent" });
        } catch (err) {
          // 404/410 means the browser dropped the subscription — prune it.
          const statusCode =
            typeof err === "object" && err !== null && "statusCode" in err
              ? (err as { statusCode?: number }).statusCode
              : undefined;

          if (statusCode === 410 || statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
            results.push({ user: profile.id, status: "removed" });
          } else {
            results.push({ user: profile.id, status: "error" });
          }
        }
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const removed = results.filter((r) => r.status === "removed").length;
    const failed = results.filter((r) => r.status === "error").length;

    await supabase.from("cron_runs").insert({
      job: "notifications/push",
      ok: failed === 0,
      sent,
      detail: `${sent} sent, ${removed} stale subscriptions pruned, ${failed} failed`,
    });

    return NextResponse.json({ sent, removed, total: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[NOTIFY PUSH] Error:", error);

    await supabase
      .from("cron_runs")
      .insert({ job: "notifications/push", ok: false, sent: 0, detail: message });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
