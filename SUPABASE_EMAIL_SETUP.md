# Supabase Email Template Configuration

## Fix 1: Update Email Branding (Stop showing "Supabase")

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/lswokcwolcshgxdznxrx)
2. Click **Authentication** → **Email Templates**
3. Update each template below:

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

### Invite User Email Template

**Subject:**
```
You've been invited to Dynamic Recipe App
```

**Body:**
```html
<h2>You're Invited!</h2>

<p>Hi {{ .Email }},</p>

<p>You've been invited to join Dynamic Recipe App. Click the button below to accept:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>

<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>

<p>Best regards,<br>Dynamic Recipe App Team</p>
```

### Magic Link Email Template

**Subject:**
```
Your Dynamic Recipe App login link
```

**Body:**
```html
<h2>Login to Dynamic Recipe App</h2>

<p>Hi {{ .Email }},</p>

<p>Click the button below to log in:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">Log In</a></p>

<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>

<p>If you didn't request this email, you can safely ignore it.</p>

<p>Best regards,<br>Dynamic Recipe App Team</p>
```

### Change Email Address Template

**Subject:**
```
Confirm your new email for Dynamic Recipe App
```

**Body:**
```html
<h2>Confirm Email Change</h2>

<p>Hi {{ .Email }},</p>

<p>Click the button below to confirm your new email address:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">Confirm New Email</a></p>

<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>

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

## Fix 2: Disable Email Confirmation (Optional - for easier testing)

If you want users to be able to sign up and immediately use the app without checking email:

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Confirm email** to **OFF**
4. Click **Save**

⚠️ **Note:** For production apps, keeping email confirmation ON is recommended for security.

---

## Fix 3: Update Site URL (Important!)

Make sure your Site URL matches your deployed app:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

---

After making these changes, new signups will see "Dynamic Recipe App" instead of "Supabase" in their emails!
