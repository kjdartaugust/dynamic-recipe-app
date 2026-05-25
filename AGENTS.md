# Project Brief: Zero-Cost AI-Driven Recipe Web App
You are building a sophisticated Next.js recipe application using purely free cloud tiers. 

## Architectural Constraints
- Frontend & API Handlers: Next.js (App Router, Tailwind CSS, TypeScript, shadcn/ui components)
- Database & Identity Layer: Supabase (PostgreSQL with pgvector, Auth, Storage Buckets)
- AI Processing: OpenRouter (Gemini Flash via OpenRouter API)
- Voice Integration: Built-in Browser Web Speech Recognition API

## Engineering Execution Roadmap

### Phase 1: Foundational Database Schema
1. Scaffold an empty Next.js project with Tailwind CSS.
2. Generate a PostgreSQL database initialization script for Supabase containing tables:
   - `profiles` (id matching auth.users, username, avatar_url)
   - `recipes` (id, user_id, title, description, instructions, macros, created_at)
   - `ingredients` (id, recipe_id, name, amount, unit)
3. Set up default Row Level Security (RLS) configurations enabling public reads but restricting writes to authenticated profile owners.
4. Establish a Supabase Storage Bucket setup file for `recipe-images`.

### Phase 2: Frontend Layout & UI Shell
1. Code a clean desktop/mobile responsive UI wrapper using standard Tailwind styling.
2. Build core routing structures:
   - `/dashboard` -> Interactive grid displaying standard or generated recipes.
   - `/recipes/[id]` -> Detail workspace with a clean markdown reader interface.
   - `/recipes/create` -> Client-side recipe creation workbench.
3. Configure the `@supabase/supabase-js` client layer using environment file variables.

### Phase 3: AI Engine Implementation
1. `/api/ai/scan` -> API endpoint processing an uploaded photo. It must pass the image buffer directly to the Gemini Flash SDK and instruct it to cleanly isolate ingredients and output a valid JSON format list.
2. `/api/ai/modify` -> Route accepting a structural recipe string and string modifiers (e.g., "vegan", "triple quantities"). It leverages Gemini Flash to re-calculate structural adjustments and generate an estimated macronutrient output.
3. Voice Control -> Code a reusable client-side React Hook that utilizes `window.webkitSpeechRecognition`. Ensure speech prompts ("Next", "Back", "Repeat") update the recipe state seamlessly.

### Phase 4: Production Read Readiness
1. Set up optimized Next.js standard SEO metadata wrappers across structural routing files.
2. Confirm `.env.example` lists variables cleanly: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`.

### Phase 5: Bold Warm Gradient UI Redesign
1. Define warm gradient CSS variables (`--primary: #ea580c`, etc.) and custom utilities (`gradient-bg-hero`, `gradient-text`, `btn-gradient`, `card-gradient`).
2. Redesign Landing page with full-width orange→red→yellow gradient hero, decorative blur circles, warm feature cards.
3. Redesign Dashboard with gradient recipe cards, hover lift effects, orange accent tags, and removal of temporary debug banner.
4. Redesign Recipe Detail with gradient header overlay, animated fire icon (`fire-icon` / `fire-icon-hover` keyframes), warm macro cards.
5. Redesign Create Recipe form with orange-tinted inputs, gradient section headers, warm borders.
6. Redesign Navigation with gradient logo text (`gradient-text`), orange active states, warm mobile menu.
7. Redesign Login & Register with warm form styling and gradient icons.

### Phase 6: Animated Fire Icon
- CSS keyframes: `fire-pulse` (gentle default, 2.5s), `fire-flicker` (lively hover, 0.8s), `fire-glow` (subtle glow loop).
- Applied to logo, recipe placeholder images, and favicon area.

### Phase 7: Build & Deploy
- `next build` passes with zero TypeScript errors.
- Committed and pushed to GitHub (`4d5def8`) — Vercel auto-deploy triggered.
- All 13 routes compile successfully (static + dynamic).