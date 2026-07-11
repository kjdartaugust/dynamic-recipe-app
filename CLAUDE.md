# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack) at http://localhost:3000
npm run build    # Production build — must pass with zero TS errors before deploy
npm run start    # Serve the production build
npm run lint     # ESLint (eslint-config-next)
```

There is no test suite. Verification is done via `npm run build` and manual testing.

Vercel auto-deploys on every push to `main`.

## Architecture

Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4. Backend is Supabase (Postgres, Auth, Storage). Import alias `@/*` → `src/*`.

### Supabase clients — four distinct patterns
- `src/lib/supabase-client.ts` — `createBrowserClient`, for Client Components (`"use client"`).
- `src/lib/supabase-server.ts` — `createServerClient` bound to `next/headers` cookies, for Server Components and route handlers. **Anon key, subject to RLS.**
- `src/lib/supabase-admin.ts` — `createAdminClient()`, **service-role key, bypasses RLS**, can call `auth.admin.*`. Server-only (throws if imported client-side). Required by anything that runs with *no logged-in user*, because under the anon key `auth.uid()` is `null` and RLS matches zero rows. Used by the notification crons, account deletion, and `api/admin/*`.
- `src/proxy.ts` — **this is the Next.js 16 replacement for `middleware.ts`** (do not create a `middleware.ts`). It only refreshes the auth session cookie on every request; it deliberately does **not** redirect. Auth gating happens inside route handlers / server components, not here.

Note: some older route handlers (e.g. `src/app/api/recipes/route.ts`) inline their own `createServerClient` instead of using the `supabase-server.ts` helper — prefer the helper for new code.

### Admin surface
`is_admin` is a column on `profiles`. Every `api/admin/*` route calls `requireAdmin()` (`src/lib/admin-auth.ts`), which checks the flag against the caller's session and returns **404** (not 403) so the surface isn't discoverable. `src/app/admin/page.tsx` re-checks server-side as defence in depth; the nav link is cosmetic only.

**`profiles` uses column-level grants (migration 013), not a blanket `GRANT ALL`.** The table has a "viewable by everyone" RLS policy, so a blanket grant would let any user read everyone's `email` and — worse — `UPDATE profiles SET is_admin = true` on their own row. RLS is row-level and cannot prevent either. Consequences:
- `select("*")` on `profiles` **fails** with a permission error. Always name columns.
- `email` and `is_admin` are readable/writable only via the service-role client.

### Cron auth
Vercel Cron sends a **`GET`** with **`Authorization: Bearer $CRON_SECRET`** — not a POST, and not a custom header. Use `isCronAuthorized()` (`src/lib/cron-auth.ts`). Getting this wrong fails silently: the job 405s or 401s on schedule and nothing sends.

### Auth gating pattern
Route handlers that require a user call `supabase.auth.getUser()` and return `401` if absent. Client-side, `src/contexts/auth-context.tsx` (`useAuth`) wraps sign-in/up/out and tracks the user via `onAuthStateChange`.

### AI providers are mixed per-route (important — docs are stale)
`README.md` and `AGENTS.md` claim "OpenRouter / Gemini Flash" everywhere, but the actual code uses **three different providers** depending on the route. When editing an AI route, match the provider already in that file:

| Route | Provider | Env var | Model |
|---|---|---|---|
| `api/ai/scan` (vision, photo→ingredients) | Google Gemini | `GEMINI_API_KEY` | `gemini-2.5-flash` |
| `api/ai/modify`, `api/ai/rescue`, `api/fridge/suggestions`, `api/chat` | Groq | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| `api/ai/import-url`, `api/ai/import-text` | OpenRouter | `OPENROUTER_API_KEY` | (per file) |

AI-generated food images use **Pollinations.ai** (no API key, generated on-demand from a prompt URL).

**Shared AI response pattern:** prompts demand strict JSON, then the handler parses defensively with a 3-tier fallback: `JSON.parse(text)` → extract from a ` ```json ``` ` code block → match the first `{…}` block. Reuse this when adding AI routes rather than assuming clean JSON.

### Rate limiting
`src/lib/rate-limit.ts` provides `createRateLimiter(maxRequests, windowMs)`, keyed by `IP:path` in an **in-memory `Map`**. This does not share state across serverless instances, so limits are per-instance/best-effort. Currently applied to `api/ai/scan` (5/min).

### Database migrations (manual, not automated)
SQL lives in `supabase/migrations/*.sql` and must be **run by hand in the Supabase SQL Editor** — there is no migration runner. New tables require an explicit `GRANT ALL ON public.<table> TO authenticated;` (RLS + grants are separate). Diagnostic error codes:
- `PGRST205` → migration not run / table not in schema cache
- `PGRST200` → missing FK constraint
- `42501` → insufficient privilege (missing GRANT)

Core tables: `profiles`, `recipes`, `ingredients`, `fridge_items`, `categories`, `tags`, `recipe_tags`, `favorites`, `collections`, `meal_plan_items`, `shopping_list_items`, `ratings`, `push_subscriptions`. TypeScript row types are in `src/lib/types.ts`.

### Scheduled jobs
`vercel.json` defines two Vercel Crons, both daily at 09:00 UTC: `api/notifications/email` (Resend) and `api/notifications/push/send` (Web Push / VAPID). Protect these with `CRON_SECRET`.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # crons, account deletion, api/admin/* — NEVER expose to the client
NEXT_PUBLIC_SITE_URL=       # absolute base URL for links in outbound email
GEMINI_API_KEY=            # api/ai/scan
GROQ_API_KEY=             # modify, rescue, chat, fridge/suggestions
OPENROUTER_API_KEY=       # ai/import-*
# Notifications (optional)
RESEND_API_KEY=
FROM_EMAIL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
CRON_SECRET=              # crons 401 without this — it is not optional in prod
```

`NEXT_PUBLIC_*` vars are inlined at build time — changing them requires a rebuild, and the dev server must be restarted after editing `.env.local`.

## Gotchas
- **Two Next config files exist:** `next.config.ts` (image `remotePatterns` for Supabase Storage) and `next.config.js` (Turbopack `root`). Next.js loads only one — be deliberate about which one you edit and avoid splitting config across both.
- `AGENTS.md` describes product/feature intent ("ZeroWaste Chef") and is useful for domain context, but its tech-stack and AI-provider claims are outdated — trust the code.
