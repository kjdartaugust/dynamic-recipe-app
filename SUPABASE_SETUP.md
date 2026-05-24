# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization (or create one)
4. Enter project details:
   - **Name**: `dynamic-recipe-app`
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
5. Click "Create New Project" (wait ~2 minutes)

---

## 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## 3. Apply Database Schema

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** ✅

Repeat for `supabase/storage-setup.sql`

---

## 4. Configure Authentication

### Enable Email Authentication (already enabled by default)

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. (Optional) Configure SMTP for email confirmations

### Configure Site URL (for redirects)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add redirects:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-url.com/auth/callback` (for production)

---

## 5. Create .env.local

In your project root, create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)

# OpenRouter AI Configuration  
OPENROUTER_API_KEY=your-openrouter-api-key
```

---

## 6. Start Development Server

```bash
yarn dev
```

Visit `http://localhost:3000`

---

## Testing Authentication

1. Go to `/register`
2. Create an account
3. Check Auth → Users in Supabase dashboard to confirm
4. Go to `/login` and sign in
5. You should see your username in the navigation bar

---

## Troubleshooting

### Email Confirmation Issues
- If you want to skip email confirmation during development:
  - Go to Auth → Providers → Email
  - Disable **Confirm Email**
  - Save changes

### Row Level Security (RLS)
- If you can't read/write data:
  - Check that RLS policies are enabled (covered in schema)
  - Ensure user is authenticated for write operations

### CORS Issues
- Add `http://localhost:3000` to:
  - Auth → URL Configuration → Site URL
  - Storage → Policies → Allowed origins (if needed)
