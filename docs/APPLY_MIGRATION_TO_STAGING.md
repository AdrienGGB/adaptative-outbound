# Apply Migration to Staging - Step by Step

## Overview
This guide walks you through applying the database migration to the staging Supabase project manually via the dashboard.

**Staging Project:** https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl

---

## Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. Log in if needed
3. You should see the project dashboard

---

## Step 2: Open SQL Editor

1. Click on "SQL Editor" in the left sidebar
2. Click "New query" button (top right)

---

## Step 3: Copy Migration SQL

1. Open the migration file on your computer:
   ```
   /Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/001_auth_and_workspaces.sql
   ```

2. Copy the **entire contents** of the file

---

## Step 4: Run Migration

1. Paste the SQL into the Supabase SQL Editor
2. Click "Run" button (or press Cmd+Enter)
3. Wait for execution to complete

**Expected output:**
```
Success. No rows returned
```

**If you see errors:**
- Check if tables already exist (may need to drop them first)
- Verify you're in the correct project
- Check the error message for specific issues

---

## Step 5: Verify Tables Were Created

1. Click on "Table Editor" in the left sidebar
2. You should see these tables:
   - ✅ profiles
   - ✅ workspaces
   - ✅ workspace_members
   - ✅ workspace_invitations
   - ✅ user_sessions
   - ✅ api_keys
   - ✅ audit_logs
   - ✅ system_controls

3. Click on each table to verify the schema

---

## Step 6: Check Initial Data

1. Click on `system_controls` table
2. You should see 6 rows with feature flags:
   - user_signup
   - oauth_google
   - oauth_microsoft
   - oauth_azure
   - workspace_creation
   - api_keys

---

## Step 7: Get Service Role Key

1. Click on "Settings" (gear icon) in left sidebar
2. Click on "API" under "Configuration"
3. Scroll to "Project API keys"
4. Find the `service_role` key (labeled "secret")
5. Click "Reveal" and copy the key
6. **IMPORTANT:** Keep this secure, never commit to git

---

## Step 8: Update Environment File

1. Open `web-app/.env.staging` on your computer
2. Replace `REPLACE_WITH_SERVICE_ROLE_KEY` with the actual key:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Save the file

---

## Step 9: Update Vercel Environment Variables

### Via Vercel Dashboard:

1. Go to your Vercel project
2. Click "Settings" > "Environment Variables"
3. Add these variables with scope = "Preview":

   **NEXT_PUBLIC_SUPABASE_URL**
   ```
   https://hymtbydkynmkyesoaucl.supabase.co
   ```

   **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bXRieWRreW5ta3llc29hdWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTc0NjksImV4cCI6MjA3NTA3MzQ2OX0.4vS3hNZ_e49k050AsIk8cdFAQfidMXUHiTIA_hz41tM
   ```

   **SUPABASE_SERVICE_ROLE_KEY**
   ```
   [paste-the-service-role-key-you-copied]
   ```

   **NODE_ENV**
   ```
   staging
   ```

4. Click "Save" for each variable

---

## Step 10: Test Staging Environment

### Deploy a Preview:

```bash
# Create a test branch
git checkout -b test-staging-supabase

# Make a small change (or just commit)
git commit --allow-empty -m "test: verify staging Supabase connection"

# Push to trigger Vercel preview deployment
git push origin test-staging-supabase
```

### Verify Deployment:

1. Check Vercel dashboard for deployment
2. Open the preview URL
3. Try to sign up a test user
4. Check in Supabase Dashboard > Authentication > Users
5. Verify the user appears

---

## Step 11: Configure Authentication (Optional)

### Set Redirect URLs:

1. In Supabase Dashboard, go to "Authentication" > "URL Configuration"
2. Add these redirect URLs:
   ```
   https://[your-vercel-app].vercel.app/auth/callback
   https://[your-vercel-app].vercel.app/**
   ```

3. Click "Save"

---

## Troubleshooting

### Migration Fails with "relation already exists"

**Solution:** Tables might already exist. Either:
1. Drop the existing tables first (in SQL Editor):
   ```sql
   DROP TABLE IF EXISTS profiles CASCADE;
   DROP TABLE IF EXISTS workspaces CASCADE;
   -- etc...
   ```
2. Or use a fresh Supabase project

### "Permission denied" errors

**Solution:** Make sure you're logged in with admin access to the Supabase project

### Tables created but no data

**Solution:** The `system_controls` data insert might have failed. Run manually:
```sql
INSERT INTO system_controls (feature, enabled, description) VALUES
  ('user_signup', true, 'Allow new user signups'),
  ('oauth_google', true, 'Google OAuth login'),
  ('oauth_microsoft', false, 'Microsoft OAuth login'),
  ('oauth_azure', false, 'Azure AD login'),
  ('workspace_creation', true, 'Allow workspace creation'),
  ('api_keys', true, 'Allow API key generation');
```

---

## Success Checklist

- [ ] Migration SQL executed successfully
- [ ] All 8 tables created
- [ ] Initial data (system_controls) inserted
- [ ] Service role key obtained
- [ ] `.env.staging` updated with service role key
- [ ] Vercel environment variables configured
- [ ] Preview deployment tested
- [ ] User signup works
- [ ] User appears in Supabase Dashboard

---

## Next Steps

After staging is working:
1. Create production Supabase project
2. Apply same migration to production
3. Configure production environment variables
4. Deploy to production

See `docs/ENVIRONMENT_SETUP.md` for detailed production setup instructions.

---

**Staging Dashboard:** https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
