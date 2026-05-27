import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { resend, isEmailConfigured } from "@/lib/resend";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all users with email notifications enabled
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, email_notifications, notify_before_days")
      .eq("email_notifications", true);

    if (profileError || !profiles?.length) {
      return NextResponse.json({ sent: 0, error: profileError?.message || "No users" });
    }

    const results = [];

    for (const profile of profiles) {
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email;
      if (!email) continue;

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

      const itemList = items
        .map((item) => {
          const days = getDaysUntilExpiry(item.expiry_date);
          const dayText = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
          return `• ${item.name} — expires ${dayText}`;
        })
        .join("\n");

      try {
        await resend!.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: email,
          subject: `🔔 ${items.length} item${items.length > 1 ? "s" : ""} expiring soon!`,
          text: `Hi ${profile.username || "there"},

You have ${items.length} item${items.length > 1 ? "s" : ""} in your fridge expiring soon:

${itemList}

Don't let them go to waste! Visit your Fridge to generate a rescue recipe.

ZeroWaste Chef
https://your-app-url.com/fridge
`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expiry Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🔔 Expiry Alert</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Hi ${profile.username || "there"}, you have <strong>${items.length} item${items.length > 1 ? "s" : ""}</strong> in your fridge expiring soon:
      </p>
      <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        ${items
          .map((item) => {
            const days = getDaysUntilExpiry(item.expiry_date);
            const dayText = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
            return `<div style="padding: 8px 0; border-bottom: 1px solid #fed7aa; color: #7c2d12; font-weight: 500;">• ${item.name} <span style="color: #ea580c; font-size: 14px;">— expires ${dayText}</span></div>`;
          })
          .join("")}
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://your-app-url.com/fridge" style="display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">View My Fridge →</a>
      </div>
      <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
        You're receiving this because you enabled email notifications in ZeroWaste Chef.
      </p>
    </div>
  </div>
</body>
</html>
          `,
        });
        results.push({ user: email, items: items.length, status: "sent" });
      } catch (err: any) {
        results.push({ user: email, items: items.length, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "sent").length,
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[NOTIFY EMAIL] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
