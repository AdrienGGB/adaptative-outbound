# Production Migration Guide - BUG001 & BUG002 Fixes

## Overview
This guide provides step-by-step instructions to apply the bug fixes for Apollo API key saving and workspace deletion to your production Supabase instance.

## Prerequisites
- Access to Supabase Dashboard: https://supabase.com/dashboard
- Project: Adaptive Outbound (hymtbydkynmkyesoaucl)
- Admin/owner access to run SQL queries

## Migrations to Apply

Two migrations need to be applied in order:

1. **20251020000001_add_workspace_delete_policy.sql** - Fixes workspace deletion
2. **20251020000002_fix_workspace_settings_rls_update.sql** - Fixes Apollo API key saving

## Migration 1: Workspace Delete Policy

### Step 1: Access SQL Editor
1. Go to https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy and Paste Migration SQL

```sql
-- Migration: 20251020000001_add_workspace_delete_policy.sql
-- Fix: Allow workspace owners and admins to delete workspaces

-- First, drop the existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Workspace owners can update workspace" ON workspaces;

-- Create improved UPDATE policy that allows both owners and admins
CREATE POLICY "Workspace owners and admins can update workspace"
  ON workspaces FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- Create DELETE policy allowing owners and admins to delete workspaces
CREATE POLICY "Workspace owners and admins can delete workspace"
  ON workspaces FOR DELETE
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
```

### Step 3: Run the Query
1. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
2. Verify you see: **"Success. No rows returned"** or similar success message

### Step 4: Verify
Run this query to check the policies exist:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'workspaces'
  AND policyname LIKE '%delete%'
ORDER BY policyname;
```

You should see the new DELETE policy listed.

---

## Migration 2: Workspace Settings RLS Update Policy

### Step 1: New Query
1. In SQL Editor, click **"New query"** again

### Step 2: Copy and Paste Migration SQL

```sql
-- Migration: 20251020000002_fix_workspace_settings_rls_update.sql
-- Fix: Add WITH CHECK clause to allow UPDATE operations on workspace_settings

-- Drop the existing policy
DROP POLICY IF EXISTS "Workspace admins can manage settings" ON workspace_settings;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Workspace admins can manage settings"
  ON workspace_settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### Step 3: Run the Query
1. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
2. Verify you see: **"Success. No rows returned"** or similar success message

### Step 4: Verify
Run this query to check the policy configuration:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workspace_settings'
ORDER BY policyname;
```

You should see the policy has **both** `qual` (USING clause) and `with_check` (WITH CHECK clause) populated.

---

## Post-Migration Verification

### Test 1: Apollo API Key Save
1. Log into your production app
2. Go to **Workspace Settings → API Settings**
3. Enter a test Apollo API key: `test-key-12345`
4. Click **"Save API Key"**
5. ✅ Should see success message
6. ✅ Badge should show "Configured"
7. Click **"Remove Key"**
8. ✅ Should see success message
9. ✅ Badge should disappear

### Test 2: Workspace Deletion (Use Test Workspace!)
1. **IMPORTANT:** Use a test workspace, not production data!
2. Go to **Workspace Settings**
3. Scroll to **"Danger Zone"**
4. Click **"Delete Workspace"** button
5. ✅ Modern dialog should appear
6. ✅ List of data to be deleted should display
7. Type the exact workspace name
8. Click **"Delete Workspace"**
9. ✅ Workspace should be deleted
10. ✅ You should be signed out and redirected

---

## Rollback Plan (If Needed)

### Rollback Migration 1 (Workspace Delete)

If you need to rollback the workspace delete policy:

```sql
-- Remove the new policies
DROP POLICY IF EXISTS "Workspace owners and admins can delete workspace" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners and admins can update workspace" ON workspaces;

-- Restore original UPDATE policy
CREATE POLICY "Workspace owners can update workspace"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id);
```

### Rollback Migration 2 (Workspace Settings)

If you need to rollback the workspace settings fix:

```sql
-- Remove the new policy
DROP POLICY IF EXISTS "Workspace admins can manage settings" ON workspace_settings;

-- Restore original policy (without WITH CHECK)
CREATE POLICY "Workspace admins can manage settings"
  ON workspace_settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

**Note:** Rollback is NOT recommended unless there's a critical issue. The new policies fix actual bugs.

---

## Troubleshooting

### Error: "policy already exists"
- The policy might already be applied
- Check if it's already there: `SELECT * FROM pg_policies WHERE tablename = 'workspaces';`
- If it exists with the correct definition, no action needed

### Error: "permission denied"
- Ensure you're logged in as a database admin/owner
- Check you're in the correct project
- Try refreshing your session

### Migration seems to hang
- Check for locks: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
- Reload the SQL Editor page
- Try again

### Testing fails after migration
- Double-check both migrations were applied successfully
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Check for any error messages in the browser console
- Review Supabase logs in Dashboard → Logs

---

## Migration Status Checklist

Use this checklist to track your migration progress:

- [ ] Accessed Supabase Dashboard SQL Editor
- [ ] Applied Migration 1: Workspace Delete Policy
- [ ] Verified Migration 1 success message
- [ ] Checked DELETE policy exists in pg_policies
- [ ] Applied Migration 2: Workspace Settings RLS Update
- [ ] Verified Migration 2 success message
- [ ] Checked policy has both USING and WITH CHECK clauses
- [ ] Tested Apollo API key save (success)
- [ ] Tested Apollo API key remove (success)
- [ ] Tested workspace deletion on test workspace (success)
- [ ] Documented any issues encountered
- [ ] Notified team of successful migration

---

## Support

If you encounter any issues:

1. **Check the error message** carefully
2. **Review the verification queries** to see current state
3. **Check Supabase Dashboard → Logs** for detailed errors
4. **Refer to rollback section** if needed
5. **Document the issue** for future reference

---

## Timeline

**Estimated time:** 5-10 minutes

- Migration 1: 2-3 minutes
- Migration 2: 2-3 minutes
- Verification: 3-5 minutes

---

## Notes

- These migrations are **safe to run** on production
- They only modify RLS policies, not data
- **Zero downtime** - users won't be affected during migration
- **Reversible** - rollback available if needed
- **No data loss** - policies only control access, not data

---

## Success Criteria

✅ Both migrations applied successfully
✅ No error messages in SQL Editor
✅ Policies visible in pg_policies table
✅ Apollo API key save/remove works
✅ Workspace deletion works (test workspace)
✅ No user complaints or errors reported

---

**Migration prepared by:** Claude Code AI Agent
**Date:** 2025-10-20
**Migrations:** BUG001 & BUG002 Fixes
**Status:** Ready for Production
