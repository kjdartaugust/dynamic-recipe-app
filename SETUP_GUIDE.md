# ZeroWaste Chef — Setup Guide

## Supabase SQL Fix (Required)

The `012_push_subscriptions.sql` migration had a bad line referencing a non-existent sequence. Here's the **corrected script** to run in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor (only once)
-- Fixes push_subscriptions table + notification columns

-- 1. Add notification columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_before_days INTEGER DEFAULT 3;

-- 2. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
```

**After running it:** Go to your Supabase Dashboard → Project Settings → General → "Restart project" to clear the schema cache.

---

## Email Notifications Setup (Resend)

### Step 1: Sign up
1. Go to **https://resend.com**
2. Sign up with your email or GitHub
3. Verify your email

### Step 2: Add a domain (optional but recommended)
- Free tier works with shared domain: `onboarding@resend.dev`
- For production: Add your custom domain in Resend dashboard → Domains → "Add Domain"
  - Add the DNS records (SPF, DKIM, DMARC) to your domain provider
  - Wait for verification (usually instant)

### Step 3: Get your API key
1. Resend Dashboard → API Keys → "Create API Key"
2. Name it "zerowaste-chef"
3. Keep it in "Sending access" mode
4. Copy the key (starts with `re_`)

### Step 4: Add to your environment

**For local dev** (`.env.local`):
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev
CRON_SECRET=any_random_string_you_make_up
```

**For Vercel production** (Vercel Dashboard → Project → Settings → Environment Variables):
```
RESEND_API_KEY = re_xxxxxxxxxxxxx
FROM_EMAIL = onboarding@resend.dev
CRON_SECRET = any_random_string_you_make_up
```

The `CRON_SECRET` is just a random string you create. It protects the cron job endpoints from being called by anyone.

### Step 5: Test emails
1. Add some ingredients to your fridge with expiry dates within 3 days
2. Make sure `email_notifications` is true in your `profiles` row
3. Run Resend's test or wait for the daily 9 AM UTC cron

---

## Web Push Notifications Setup (Optional)

If you want browser push notifications:

### Generate VAPID keys
```bash
npx web-push generate-vapid-keys
```

### Add to environment
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:youremail@example.com
```

---

## Daily Cron Jobs (Vercel)

Already configured in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/notifications/email", "schedule": "0 9 * * *" },
    { "path": "/api/notifications/push/send", "schedule": "0 9 * * *" }
  ]
}
```

Both run at **9 AM UTC daily**.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `42P01: relation does not exist` | Migration not run in SQL Editor | Run the SQL above |
| `PGRST205` | Schema cache stale | Restart Supabase project |
| `PGRST200` | Missing FK relationship | Run ALTER TABLE to add constraint |
| `42501` | Insufficient privilege | Run GRANT ALL on table |
| Emails not sending | RESEND_API_KEY missing | Add to Vercel env vars |
| Push not working | VAPID keys missing | Generate and add keys |

---

## Migration Checklist

Run these in order in Supabase SQL Editor:

1. `001_profiles.sql`
2. `002_recipes.sql`
3. `003_tags_shopping_list.sql`
4. `004_meal_planner.sql`
5. `005_ratings.sql`
6. `006_fix_categories_permissions.sql`
7. `007_grant_all_permissions.sql`
8. `008_public_recipes.sql`
9. `009_ratings_profiles_fk.sql`
10. `010_fridge_items.sql`
11. `011_notification_preferences.sql`
12. `012_push_subscriptions.sql` (fixed version above)

After each batch: **Restart project** in Supabase settings.
