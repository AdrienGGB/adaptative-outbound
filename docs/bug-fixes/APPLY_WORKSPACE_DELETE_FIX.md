# Apply Workspace Delete Fix - Quick Guide

**Migration:** `20251020000001_add_workspace_delete_policy.sql`
**Status:** Ready to Apply
**Estimated Time:** 2 minutes

---

## Step 1: Access Supabase Dashboard

**Staging:**
1. Go to: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. Click "SQL Editor" in left sidebar
3. Click "New query"

---

## Step 2: Copy Migration SQL

**Local file path:**
```
/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20251020000001_add_workspace_delete_policy.sql
```

**Actions:**
1. Open the file in your code editor
2. Copy the entire contents (Cmd+A, Cmd+C)

**Preview of what you're running:**
```sql
-- Adds DELETE policy for workspaces
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

-- Improves UPDATE policy to allow admins
DROP POLICY IF EXISTS "Workspace owners can update their workspace" ON workspaces;

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
```

---

## Step 3: Execute Migration

1. Paste SQL into Supabase SQL Editor
2. Click **"Run"** button (or press Cmd+Enter)
3. Wait for completion

**Expected output:**
```
Success. No rows returned
```

**If you see errors:**
- "policy already exists" - Migration already applied, skip
- "permission denied" - Verify you're logged in with correct account
- Other errors - Check error message and report back

---

## Step 4: Verify Policies

**Run this verification query:**
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'workspaces'
ORDER BY cmd, policyname;
```

**Expected result - should show these policies:**

| policyname | cmd |
|------------|-----|
| Workspace owners and admins can delete workspace | DELETE |
| Authenticated users can create workspaces | INSERT |
| Users can view workspaces they are members of | SELECT |
| Workspace owners and admins can update workspace | UPDATE |

---

## Step 5: Test the Fix

### Quick Test in Staging

1. **Deploy frontend changes:**
   ```bash
   git add .
   git commit -m "fix: Add workspace delete functionality with RLS policy"
   git push origin feature/F044-data-pipeline
   ```

2. **Wait for Vercel deployment:**
   - Check Vercel dashboard for deployment status
   - Get preview URL

3. **Test deletion:**
   - Log into staging app
   - Go to Settings > Workspace Settings
   - Click "Delete Workspace"
   - Verify new dialog appears
   - Type workspace name to confirm
   - Click "Delete Workspace"

4. **Verify results:**
   - Success toast appears
   - User logged out
   - Redirected to login
   - Workspace removed from database

### Verify in Database

**Check workspace was deleted:**
```sql
SELECT id, name, status
FROM workspaces
WHERE id = '[your-test-workspace-id]';
```

**Expected:** No rows returned (workspace completely removed)

**Check cascade deletes worked:**
```sql
-- Should return 0 for deleted workspace
SELECT COUNT(*) FROM workspace_members WHERE workspace_id = '[your-test-workspace-id]';
SELECT COUNT(*) FROM accounts WHERE workspace_id = '[your-test-workspace-id]';
SELECT COUNT(*) FROM contacts WHERE workspace_id = '[your-test-workspace-id]';
```

---

## Step 6: Apply to Production (Later)

**When ready for production:**

1. **Create production Supabase project** (if not done)
2. **Repeat Steps 1-4** on production project
3. **Deploy to production:**
   ```bash
   git checkout main
   git merge feature/F044-data-pipeline
   git push origin main
   ```
4. **Verify production deployment**
5. **Test with caution** (consider creating test workspace first)

---

## Rollback (If Needed)

**If something goes wrong:**

```sql
-- Remove new DELETE policy
DROP POLICY IF EXISTS "Workspace owners and admins can delete workspace" ON workspaces;

-- Restore original UPDATE policy
DROP POLICY IF EXISTS "Workspace owners and admins can update workspace" ON workspaces;

CREATE POLICY "Workspace owners can update their workspace"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id);
```

**Then revert frontend:**
```bash
git revert HEAD
git push origin feature/F044-data-pipeline
```

---

## Common Issues

### Issue: "policy already exists"
**Solution:** Migration already applied, you're good to go!

### Issue: Delete still doesn't work
**Checklist:**
- [ ] Migration applied successfully
- [ ] Frontend code deployed
- [ ] Browser cache cleared (hard refresh: Cmd+Shift+R)
- [ ] Logged in as admin or owner
- [ ] Check browser console for errors

### Issue: Permission denied error
**Possible causes:**
1. Not admin or owner - check role in workspace_members
2. RLS policy not applied - verify with Step 4 query
3. Database session stale - log out and log back in

---

## Success Criteria

✅ Migration executed without errors
✅ Policies visible in database
✅ Frontend deployed with new code
✅ Delete dialog shows proper confirmation
✅ Workspace deletion works for admins/owners
✅ Cascade deletes all related data
✅ User logged out and redirected after deletion

---

## Support

**If you encounter issues:**
1. Check browser console for errors
2. Check Supabase logs (Dashboard > Logs)
3. Verify policies with Step 4 query
4. Review full fix documentation: `docs/bug-fixes/WORKSPACE_DELETE_FIX.md`

---

**Ready to apply?** Follow steps 1-5 above.

**Questions?** Review the detailed fix documentation first.
