# OAuth Setup Guide for Local Development

## Overview
This guide walks you through setting up Google and Microsoft OAuth for local Supabase development.

## Prerequisites
- Local Supabase running: `supabase start`
- Supabase Studio: http://127.0.0.1:54333
- Web app: http://localhost:3000

## Part 1: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Name: "Adaptive Outbound Dev" (or similar)
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Navigate to: **APIs & Services → OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: Adaptive Outbound
   - User support email: your@email.com
   - Developer contact: your@email.com
4. Click "Save and Continue"
5. Skip scopes (click "Save and Continue")
6. Add test users (your email)
7. Click "Save and Continue"

### Step 3: Create OAuth Credentials

1. Navigate to: **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: "Adaptive Outbound Local"
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:54333`
6. Authorized redirect URIs:
   - `http://127.0.0.1:54333/auth/v1/callback`
   - `http://localhost:3000/auth/callback`
7. Click "Create"
8. **Copy Client ID and Client Secret** (you'll need these)

### Step 4: Configure in Supabase Studio

1. Open http://127.0.0.1:54333
2. Go to **Authentication → Providers**
3. Find **Google** provider
4. Enable Google provider
5. Paste:
   - Client ID: [from Google Console]
   - Client Secret: [from Google Console]
6. Redirect URL should be: `http://127.0.0.1:54333/auth/v1/callback`
7. Click "Save"

### Step 5: Test Google OAuth

1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. You should be redirected to Google login
4. After successful login, redirected back to /auth/callback → /workspace
5. Check Supabase Studio → Authentication → Users (new user should appear)

---

## Part 2: Microsoft OAuth Setup

### Step 1: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory (Entra ID)**
3. Select **App registrations → New registration**
4. Fill in:
   - Name: Adaptive Outbound Dev
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI:
     - Platform: **Web**
     - URI: `http://127.0.0.1:54333/auth/v1/callback`
5. Click "Register"

### Step 2: Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Description: "Local Development"
4. Expires: 24 months (or your preference)
5. Click "Add"
6. **Copy the secret value immediately** (you can't see it again)

### Step 3: Get Application (Client) ID

1. In your app registration, go to **Overview**
2. Copy **Application (client) ID**
3. Copy **Directory (tenant) ID**

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
6. Click "Add permissions"
7. Click **Grant admin consent** (if you have admin rights)

### Step 5: Configure in Supabase Studio

1. Open http://127.0.0.1:54333
2. Go to **Authentication → Providers**
3. Find **Azure (Microsoft)** provider
4. Enable Azure provider
5. Paste:
   - Azure Client ID: [Application (client) ID from Azure]
   - Azure Secret: [Client secret value from Azure]
   - Azure Tenant ID: [Directory (tenant) ID from Azure] OR use "common" for multi-tenant
6. Redirect URL: `http://127.0.0.1:54333/auth/v1/callback`
7. Click "Save"

### Step 6: Test Microsoft OAuth

1. Go to http://localhost:3000/login
2. Click "Continue with Microsoft"
3. Login with Microsoft account
4. After consent, redirected to /workspace
5. Verify user created in Supabase Studio

---

## Part 3: Troubleshooting

### Common Issues

**Issue: "redirect_uri_mismatch" error**
- Solution: Ensure redirect URI in Google/Azure exactly matches Supabase callback URL
- Check for trailing slashes, http vs https

**Issue: "invalid_client" error**
- Solution: Double-check Client ID and Client Secret are correct
- Ensure no extra spaces when pasting

**Issue: OAuth button does nothing**
- Solution: Check browser console for errors
- Verify Supabase is running: `supabase status`
- Check environment variables are loaded

**Issue: User created but profile not created**
- Solution: Check database trigger is working:
  ```sql
  SELECT * FROM profiles WHERE id = '[user-id]';
  ```
- Trigger should auto-create profile on auth.users insert

**Issue: Workspace not auto-created**
- Solution: Check helper function and trigger exist
- Manually run: `SELECT create_workspace_and_add_member('[user-id]');`

### Verification Checklist

After setup, verify:
- [ ] Google OAuth button redirects to Google login
- [ ] Microsoft OAuth button redirects to Microsoft login
- [ ] After OAuth login, user appears in Supabase Auth → Users
- [ ] Profile auto-created in profiles table
- [ ] Default workspace auto-created in workspaces table
- [ ] User added to workspace_members as Admin
- [ ] Redirected to /workspace after successful login

---

## Part 4: Moving to Production

When deploying to staging/production:

1. **Update redirect URLs** in Google/Azure to production domain:
   - `https://yourdomain.com/auth/callback`
   - `https://[supabase-project].supabase.co/auth/v1/callback`

2. **Create separate OAuth apps** for each environment:
   - Development: localhost URLs
   - Staging: staging.yourdomain.com URLs
   - Production: yourdomain.com URLs

3. **Store credentials securely**:
   - Use Vercel environment variables
   - Never commit OAuth secrets to git

4. **Configure in Supabase Cloud**:
   - Go to your cloud Supabase project dashboard
   - Authentication → Providers
   - Add production OAuth credentials

---

## Part 5: Testing OAuth Flow End-to-End

### Test 1: Google OAuth Signup (New User)

1. Logout if logged in
2. Go to http://localhost:3000/login
3. Click "Continue with Google"
4. Login with a Google account not yet registered
5. Grant permissions

**Expected Results:**
- ✅ Redirected to /workspace
- ✅ User created in auth.users
- ✅ Profile auto-created in profiles table
- ✅ Default workspace created with name "[Name]'s Workspace"
- ✅ User added to workspace_members as Admin
- ✅ Can see workspace dashboard

**Verify in Supabase Studio:**
```sql
-- Check user
SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'your-google-email@gmail.com';

-- Check profile
SELECT * FROM profiles WHERE email = 'your-google-email@gmail.com';

-- Check workspace
SELECT w.* FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'your-google-email@gmail.com');

-- Check membership
SELECT role FROM workspace_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-google-email@gmail.com');
```

### Test 2: Google OAuth Login (Existing User)

1. Logout
2. Go to http://localhost:3000/login
3. Click "Continue with Google"
4. Login with same Google account from Test 1

**Expected Results:**
- ✅ Redirected to /workspace
- ✅ Same user logged in
- ✅ No duplicate users created
- ✅ Sees existing workspace

### Test 3: Microsoft OAuth Signup

1. Logout
2. Go to http://localhost:3000/login
3. Click "Continue with Microsoft"
4. Login with Microsoft account
5. Grant permissions

**Expected Results:**
- ✅ Same as Test 1 but with Microsoft account

### Test 4: OAuth with Invitation Link

1. Create invitation as Admin:
   - Login as existing user
   - Go to /workspace/members
   - Click "Invite Member"
   - Email: your-oauth-test@gmail.com
   - Role: SDR
   - Copy invitation link
2. Logout
3. Paste invitation link in browser
4. Click "Continue with Google"
5. Login with Google account matching invite email

**Expected Results:**
- ✅ User created via Google OAuth
- ✅ Automatically added to workspace from invitation
- ✅ Role is SDR (from invitation)
- ✅ Invitation deleted
- ✅ Redirected to workspace

---

## Part 6: Security Best Practices

### For Development

1. **Never commit OAuth credentials to git**
   - Keep them in Supabase Studio only
   - For environment variables, use .env.local (in .gitignore)

2. **Use test accounts**
   - Add test users in Google OAuth consent screen
   - Use personal/test Microsoft accounts

3. **Limit scopes**
   - Only request necessary permissions (email, profile)
   - Don't request unnecessary Google/Microsoft scopes

### For Production

1. **Separate credentials per environment**
   - Dev: localhost credentials
   - Staging: staging domain credentials
   - Production: production domain credentials

2. **Enable verification**
   - Complete Google OAuth app verification for production
   - Complete Azure app verification

3. **Monitor OAuth usage**
   - Check Supabase Auth logs regularly
   - Monitor for suspicious OAuth attempts

4. **Rate limiting**
   - Supabase has built-in rate limiting
   - Consider additional rate limiting for OAuth endpoints

---

## Part 7: Advanced Configuration

### Email Verification with OAuth

By default, OAuth providers verify emails. But if you want to require email verification:

```sql
-- In Supabase Studio → Authentication → Settings
-- Email verification: Required
```

This will require users who sign up via email/password to verify, but OAuth users are auto-verified.

### Custom OAuth Scopes

If you need additional data from OAuth providers:

**Google:**
```javascript
// In your auth call
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly'
  }
})
```

**Microsoft:**
```javascript
await supabase.auth.signInWithOAuth({
  provider: 'azure',
  options: {
    scopes: 'email profile User.Read Calendars.Read'
  }
})
```

### Redirect URL Customization

To redirect to a specific page after OAuth:

```javascript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/onboarding`
  }
})
```

---

## Quick Reference

### Google OAuth URLs
- Console: https://console.cloud.google.com
- Credentials: APIs & Services → Credentials
- Consent Screen: APIs & Services → OAuth consent screen

### Microsoft OAuth URLs
- Azure Portal: https://portal.azure.com
- App Registrations: Azure Active Directory → App registrations
- Permissions: Your App → API permissions

### Supabase Local URLs
- Studio: http://127.0.0.1:54333
- Auth Providers: http://127.0.0.1:54333/project/default/auth/providers
- API: http://127.0.0.1:54321

### Required Redirect URIs
```
http://127.0.0.1:54333/auth/v1/callback  # Supabase callback
http://localhost:3000/auth/callback      # App callback (optional)
```

### Common Commands
```bash
# Start Supabase
supabase start

# Check Supabase status
supabase status

# View Supabase logs
supabase logs

# Reset Supabase (if needed)
supabase db reset
```

---

## Support Resources

- Supabase OAuth Docs: https://supabase.com/docs/guides/auth/social-login
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Microsoft OAuth Docs: https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
- Supabase Discord: https://discord.supabase.com

---

## Appendix: Migration for expires_at Column

If your workspace_invitations table doesn't have an `expires_at` column, add it:

```sql
-- Create migration file
-- supabase/migrations/YYYYMMDDHHMMSS_add_invitation_expiration.sql

ALTER TABLE workspace_invitations
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_expires_at
ON workspace_invitations(expires_at);

-- Optional: Clean up expired invitations automatically
-- Create a function to delete expired invitations
CREATE OR REPLACE FUNCTION delete_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM workspace_invitations
  WHERE expires_at < NOW();
END;
$$;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('delete-expired-invitations', '0 0 * * *', 'SELECT delete_expired_invitations()');
```

Apply the migration:
```bash
supabase db reset  # In local development
# OR
supabase db push   # To apply to remote
```
