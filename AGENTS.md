# ZeroWaste Chef — AI-Powered Kitchen & Food Waste Reduction App

## Product Overview
ZeroWaste Chef is a unified kitchen hub that tracks your inventory and uses AI to discover recipes from ingredients you already have — reducing food waste one meal at a time.

## Core Value Proposition
1. **Track what you have** — Fridge/pantry inventory with expiry date tracking
2. **AI invents recipes** — Discovers creative recipes using your ingredients with food photos
3. **Never waste food** — Alerts for expiring items, rescue recipes, and smart cooking suggestions

## Architectural Constraints
- Frontend & API Handlers: Next.js (App Router, Tailwind CSS, TypeScript)
- Database & Identity Layer: Supabase (PostgreSQL, Auth, RLS)
- AI Processing: OpenRouter (Gemini Flash)
- Images: Pollinations.ai (zero-cost AI food photography)
- Voice: Browser Web Speech Recognition API

## Key Pages

### `/` — Landing Page
Rebranded "ZeroWaste Chef" hero. Flow: "Add Items → AI Invent → Visualize → Cook & Save"

### `/fridge` — My Kitchen Hub (PRIMARY USER FLOW)
The unified core experience:
- **Tab 1: My Inventory** — Add ingredients (name, amount, unit, expiry). Color-coded expiry indicators. Items sorted by urgency.
- **Tab 2: AI Recipe Ideas** — Generates 4 recipe suggestions from your inventory using OpenRouter Gemini Flash. Each has:
  - AI-generated food image (Pollinations.ai, zero-cost)
  - Ingredients used from your inventory (highlighted)
  - Prep time, servings, difficulty
  - "Top Pick" badge on best option
  - One-click "Create This Recipe" → generates full recipe via `/api/ai/rescue` → redirects to create form

### `/recipes/create` — Recipe Creation
Pre-filled via My Kitchen Hub flow or manual entry. Ingredient scanner via AI photo analysis.

### `/dashboard` — My Recipes
Saved personal recipes with favorites, search, tags, ratings, and public sharing toggle.

### `/explore` — Public Recipe Discovery
Browse recipes shared by the community.

### `/meal-plan` — Weekly Meal Planner
Drag-and-drop meal planning with auto-generated shopping lists.

### `/stats` — Food Waste Impact Dashboard
Recipes created, public recipes, ingredients tracked, expiring items, and prevention tips.

### `/profile` — Account & Notifications
Manage email/push notification preferences (Resend + Web Push API), VAPID keys.

## API Endpoints

### Core
- `/api/fridge` — CRUD for inventory items
- `/api/fridge/suggestions` — GET: AI generates recipe suggestions from inventory
- `/api/fridge/expiring-count` — GET: count of items expiring within 3 days
- `/api/ai/rescue` — POST: generates full recipe from given ingredients
- `/api/ai/scan` — POST: AI identifies ingredients from photo
- `/api/ai/modify` — POST: natural language recipe modifications

### Notifications
- `/api/notifications/email` — Daily batch email alerts (Vercel Cron)
- `/api/notifications/push/send` — Daily push notifications (Vercel Cron)
- `/api/notifications/push/subscribe` — PUSH: subscribe browser for push

### Social
- `/api/chat` — ZeroWaste Chef AI chatbot (fridge-aware, 3 message guest limit)
- `/api/ratings` — Recipe ratings/reviews
- `/api/explore` — Public recipes with pagination

## Database Schema (Supabase)

### tables
- `profiles` — (id, username, email_notifications, push_notifications, notify_before_days)
- `recipes` — (id, user_id, title, description, instructions, macros, is_public, created_at)
- `ingredients` — (id, recipe_id, name, amount, unit)
- `fridge_items` — (id, user_id, name, amount, unit, expiry_date)
- `push_subscriptions` — (id, user_id, endpoint, p256dh, auth)
- `categories`, `tags`, `recipe_tags`, `favorites`, `meal_plan_items`, `shopping_list_items`

### RLS Policy Requirements
All new tables need explicit `GRANT ALL ON public.<table> TO authenticated;`
Always run `supabase/migrations/*.sql` scripts in Supabase SQL Editor immediately after commit.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=

# Notifications (optional)
RESEND_API_KEY=
FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=
```

## Notification System
1. Resend Email (100/day): Daily at 9AM UTC, sends expiry alerts with gradient HTML templates
2. Web Push: Browser push notifications with service worker
3. In-app: Fridge nav badge + dashboard expiry banner

## Critical Development Notes
1. **Migration files must be manually run** in Supabase SQL Editor. Auto-creation via SQL does NOT grant authenticated role permissions.
2. **Error codes**:
   - `PGRST205` → Migration not run (table in schema cache)
   - `PGRST200` → Missing FK constraint (run ALTER TABLE ... ADD CONSTRAINT)
   - `42501` → Insufficient privilege (run GRANT ALL)
3. **Dev server must be restarted** after `.env.local` changes or when Next.js caches old API code.
4. **Pollinations.ai images** — zero-cost, no API keys, no rate limits. Images generated on-demand from prompt.

## Project Status
All features built and deployed. Vercel auto-deploys on every push to `main`.
Build: `next build` passes with zero TypeScript errors.
