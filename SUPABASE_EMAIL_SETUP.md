# Supabase Email Configuration Guide

## Issue 1: "Supabase Auth" Shows in Emails

### Fix: Change Sender Display Name

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/lswokcwolcshgxdznxrx)
2. Click **Authentication** → **Providers**
3. Find **Email** provider and click it
4. Change **Display Name** from "Supabase Auth" to "Dynamic Recipe App"
5. Click **Save**

This changes the sender name from "Supabase Auth" to "Dynamic Recipe App"

---

## Issue 2: Email Limit Exceeded

### The Problem
Supabase free tier limits:
- **3 email confirmations per hour**
- This includes signup confirmations, password resets, magic links

### Solutions

#### Option A: Disable Email Confirmation (Development Only)

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Confirm email** to **OFF**
4. Click **Save**

Now users can sign up and immediately use the app without email verification.

⚠️ **Security Warning:** Only do this for development/testing. For production, keep email confirmation ON.

#### Option B: Use OAuth Providers (Recommended)

Add Google/GitHub OAuth which don't have email limits:

1. Go to **Authentication** → **Providers**
2. Enable **Google** or **GitHub**
3. Follow the setup instructions

#### Option C: Upgrade Supabase Plan

If you need more emails:
1. Go to **Organization Settings** → **Billing**
2. Upgrade to Pro plan ($25/month)
3. Gets you unlimited emails

---

## Issue 3: Fix Email Templates

### Confirm Signup Email Template

**Subject:**
```
Welcome to Dynamic Recipe App - Confirm your email
```

**Body:**
```html
<h2>Welcome to Dynamic Recipe App!</h2>

<p>Hi {{ .Email }},</p>

<p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">Confirm Email Address</a></p>

<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>

<p>If you didn't create an account, you can safely ignore this email.</p>

<p>Best regards,<br>Dynamic Recipe App Team</p>
```

### Reset Password Template

**Subject:**
```
Reset your Dynamic Recipe App password
```

**Body:**
```html
<h2>Reset Your Password</h2>

<p>Hi {{ .Email }},</p>

<p>Click the button below to reset your password:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>

<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>

<p>If you didn't request a password reset, you can safely ignore this email.</p>

<p>Best regards,<br>Dynamic Recipe App Team</p>
```

---

## Issue 4: Auth Session Not Persisting

If users get logged out when navigating pages:

### Fix: Update Site URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your exact Vercel URL:
   ```
   https://your-app.vercel.app
   ```
3. Add redirect URLs:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```
4. Click **Save**

### Fix: Check Cookie Settings

In your middleware, make sure cookies are properly set. The code should handle:
- `sb-access-token`
- `sb-refresh-token`

These are automatically managed by `@supabase/ssr`.

---

## Quick Checklist

- [ ] Changed Display Name to "Dynamic Recipe App"
- [ ] Updated email templates with your branding
- [ ] Set correct Site URL (your Vercel domain)
- [ ] Added redirect URLs
- [ ] Disabled email confirmation (for dev only)
- [ ] Tested signup flow

---

## Testing the Fix

1. Sign up with a new email
2. Check inbox - should show "Dynamic Recipe App" not "Supabase Auth"
3. If email confirmation is disabled: should auto-login
4. If email confirmation is enabled: click link, then login
5. Create a recipe - should NOT ask you to login again
