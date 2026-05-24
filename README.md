# Dynamic Recipe App

An AI-powered recipe management application built with Next.js, Supabase, and OpenRouter. Scan ingredients with AI, modify recipes naturally, and cook hands-free with voice control.

## Features

- **AI Ingredient Scanner** — Upload a photo and let AI identify ingredients automatically
- **Smart Recipe Modifications** — Modify recipes with natural language ("make it vegan", "double the portions")
- **Voice Control** — Hands-free cooking with voice commands (Next, Back, Repeat)
- **User Authentication** — Secure sign-up/sign-in with Supabase Auth
- **Recipe Management** — Create, view, and manage your recipe collection
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenRouter (Gemini Flash 2.0)
- **Voice**: Web Speech Recognition API

## Prerequisites

Before deploying, you need:

1. **Supabase Project** — [Create one free](https://supabase.com)
2. **OpenRouter Account** — [Sign up](https://openrouter.ai) and get an API key
3. **Node.js 18+** and **Yarn** or **npm**

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd dynamic-recipe-app
yarn install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your-openrouter-api-key
```

Get these from:
- **Supabase**: Project Settings → API
- **OpenRouter**: https://openrouter.ai/keys

### 3. Database Setup

1. Go to your Supabase project's **SQL Editor**
2. Run `supabase/migrations/001_initial_schema.sql`
3. Create the storage bucket:
   - Go to **Storage** → **New bucket**
   - Name: `recipe-images`
   - Toggle **Public bucket** ON
   - Add policies for SELECT (public), INSERT/UPDATE/DELETE (authenticated)

### 4. Auth Configuration

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add redirect: `http://localhost:3000/auth/callback`

### 5. Run Dev Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Option 1: Vercel (Recommended)

Vercel is the creators of Next.js and offers the best compatibility.

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/dynamic-recipe-app.git
git push -u origin main
```

#### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/log in
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your project folder)
   - **Build Command**: `yarn build` (default)
   - **Output Directory**: `.next` (default)

#### Step 3: Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Production, Preview, Development |
| `OPENROUTER_API_KEY` | `your-openrouter-key` | Production, Preview, Development |

> **Important**: `NEXT_PUBLIC_` variables must be set at build time. Changing them requires a rebuild.

#### Step 4: Update Supabase Auth URLs

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL** to your Vercel domain:
   - Production: `https://your-app.vercel.app`
   - Preview: `https://your-app-git-branch.vercel.app`
3. Add redirects:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app-git-branch.vercel.app/auth/callback`

#### Step 5: Redeploy

Vercel will auto-deploy on every git push. For the first deploy, click **Deploy**.

---

### Option 2: Netlify

#### Step 1: Build Settings

In Netlify dashboard → **Site settings** → **Build & deploy**:

- **Build command**: `yarn build`
- **Publish directory**: `.next`
- **Node version**: `18` (or higher)

#### Step 2: Environment Variables

Add the same environment variables as Vercel (see table above).

#### Step 3: Next.js Plugin

Netlify requires the Next.js runtime plugin. Make sure your `netlify.toml` includes:

```toml
[build]
  command = "yarn build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Install the plugin:
```bash
npm install -D @netlify/plugin-nextjs
```

#### Step 4: Update Supabase Auth URLs

Same as Vercel — add your Netlify domain to Supabase Auth URL Configuration.

---

### Option 3: Self-Hosted (Node.js Server)

If you have a VPS or dedicated server:

```bash
# Build locally or on CI
yarn build

# Start production server
yarn start
```

The app runs on port 3000 by default. Use **PM2** or **systemd** for process management.

**PM2 example:**
```bash
npm install -g pm2
pm2 start yarn --name "recipe-app" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Can register a new account
- [ ] Can create a recipe
- [ ] Dashboard shows recipes
- [ ] Recipe detail page works
- [ ] AI scan endpoint responds (test with curl or UI)
- [ ] AI modify endpoint responds
- [ ] Image upload works (if storage bucket is configured)
- [ ] Auth redirects work correctly

---

## Troubleshooting

### "permission denied for table recipes"
Run the SQL grants in your Supabase SQL Editor:
```sql
GRANT SELECT ON public.recipes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
```

### "OpenRouter API key is not configured"
Check that `OPENROUTER_API_KEY` is set in your environment variables and the deployment was rebuilt after adding it.

### Auth redirect loops
Verify your **Site URL** and redirect URLs in Supabase Auth settings match your deployed domain exactly (including `https://`).

### Images not loading
Ensure the `recipe-images` storage bucket is public and CORS is configured if accessing from a different domain.

---

## License

MIT
