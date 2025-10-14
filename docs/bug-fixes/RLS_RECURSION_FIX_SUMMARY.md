# RLS Recursion Issue - Complete Root Cause Analysis & Fix

## Executive Summary

The workspace invitation system is failing with PostgreSQL error 42P17 (infinite recursion) due to **cascading RLS policy dependencies** across 6 different tables. The migrations created to fix this were never applied to the remote database.

## Error Details

- **Error Code:** 42P17
- **Message:** "infinite recursion detected in policy for relation 'workspace_members'"
- **Trigger:** Attempting to INSERT into `workspace_invitations` table
- **Location:** Remote Supabase database (hymtbydkynmkyesoaucl.supabase.co)

---

## Root Cause: The Complete Recursion Chain

When a user tries to create a workspace invitation, PostgreSQL executes this chain:

```
1. INSERT into workspace_invitations
   ↓
2. Trigger: "Admins can create workspace invitations" INSERT policy
   ↓
3. Policy checks: SELECT FROM workspace_members WHERE role='admin'
   ↓
4. Trigger: "Members can view workspace members" SELECT policy
   ↓
5. Policy checks: SELECT FROM workspace_members WHERE user_id=auth.uid()
   ↓
6. BACK TO STEP 4 → INFINITE LOOP → ERROR 42P17
```

### Why This Happens

The `workspace_members` SELECT policy checks the `workspace_members` table to see which workspaces the user belongs to. This creates a **circular dependency**:

- To read from `workspace_members`, PostgreSQL checks the SELECT policy
- The SELECT policy queries `workspace_members` to verify access
- This triggers the SELECT policy again
- **Infinite recursion detected**

This recursion cascades to any table whose policies check `workspace_members` for permission verification.

---

## Affected Tables & Policies

### 1. workspace_members (4 policies)
**File:** `001_auth_and_workspaces.sql` lines 271-311

All four policies have recursion:

```sql
-- SELECT policy (line 272)
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members  -- ⚠️ RECURSION
      WHERE user_id = auth.uid()
    )
  );

-- INSERT policy (line 281)
CREATE POLICY "Admins can insert workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm  -- ⚠️ RECURSION
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- UPDATE and DELETE policies have identical issues
```

**Impact:** Cannot view, insert, update, or delete workspace members without triggering recursion.

---

### 2. workspace_invitations (2 policies)
**File:** `001_auth_and_workspaces.sql` lines 316-336

```sql
-- SELECT policy (line 316)
CREATE POLICY "Admins can view workspace invitations"
  ON workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members  -- ⚠️ Triggers workspace_members SELECT → RECURSION
      WHERE workspace_members.workspace_id = workspace_invitations.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- INSERT policy (line 327)
CREATE POLICY "Admins can create workspace invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members  -- ⚠️ Triggers workspace_members SELECT → RECURSION
      WHERE workspace_members.workspace_id = workspace_invitations.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
```

**Impact:** Cannot create or view invitations - THIS IS THE ERROR YOU'RE EXPERIENCING.

---

### 3. workspaces (1 policy)
**File:** `001_auth_and_workspaces.sql` lines 250-258

```sql
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members  -- ⚠️ RECURSION
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );
```

**Impact:** Viewing workspaces may trigger recursion.

---

### 4. api_keys (3 policies)
**File:** `001_auth_and_workspaces.sql` lines 352-383

All three policies (SELECT, INSERT, UPDATE) query `workspace_members` to verify admin status.

**Impact:** Cannot manage API keys without triggering recursion.

---

### 5. audit_logs (1 policy)
**File:** `001_auth_and_workspaces.sql` lines 388-397

```sql
CREATE POLICY "Admins can view workspace audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members  -- ⚠️ RECURSION
      WHERE workspace_members.workspace_id = audit_logs.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
```

**Impact:** Cannot view audit logs without triggering recursion.

---

### 6. system_controls (1 policy)
**File:** `001_auth_and_workspaces.sql` lines 410-418

```sql
CREATE POLICY "Only admins can update system controls"
  ON system_controls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members  -- ⚠️ RECURSION
      WHERE workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
```

**Impact:** Cannot update system controls without triggering recursion.

---

## The Solution: SECURITY DEFINER Function

### Why It Works

PostgreSQL's `SECURITY DEFINER` function runs with the privileges of the function **creator** (typically a superuser), bypassing RLS policies entirely.

The function `get_user_workspace_memberships()` was created in migration `20250105000003_add_get_user_workspace_memberships.sql`:

```sql
CREATE OR REPLACE FUNCTION get_user_workspace_memberships(p_user_id UUID)
RETURNS TABLE (
  workspace_id UUID,
  role VARCHAR,
  workspace_name VARCHAR,
  workspace_slug VARCHAR,
  workspace_plan VARCHAR,
  workspace_seats_limit INTEGER
)
SECURITY DEFINER  -- ⚠️ This is the key - bypasses RLS!
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wm.workspace_id,
    wm.role,
    w.name as workspace_name,
    w.slug as workspace_slug,
    w.plan as workspace_plan,
    w.seats_limit as workspace_seats_limit
  FROM workspace_members wm
  JOIN workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = p_user_id
    AND wm.status = 'active';
END;
$$;
```

### How to Use It

Instead of:
```sql
-- BAD: Causes recursion
SELECT 1 FROM workspace_members
WHERE workspace_id = X AND user_id = auth.uid()
```

Use:
```sql
-- GOOD: No recursion
SELECT 1 FROM get_user_workspace_memberships(auth.uid()) wm
WHERE wm.workspace_id = X
```

---

## Fix Implementation

### Migration File Created

**File:** `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20250113000002_fix_all_workspace_rls_recursion.sql`

This comprehensive migration fixes ALL 6 affected tables (12 total policies).

### What the Migration Does

1. **Drops** all broken policies that cause recursion
2. **Recreates** policies using `get_user_workspace_memberships()` function
3. **Adds comments** explaining the fix for future developers

### Tables Fixed

- ✅ workspace_members (4 policies: SELECT, INSERT, UPDATE, DELETE)
- ✅ workspace_invitations (2 policies: SELECT, INSERT) **← YOUR ERROR**
- ✅ workspaces (1 policy: SELECT)
- ✅ api_keys (3 policies: SELECT, INSERT, UPDATE)
- ✅ audit_logs (1 policy: SELECT)
- ✅ system_controls (1 policy: UPDATE)

---

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file:
   ```bash
   cat supabase/migrations/20250113000002_fix_all_workspace_rls_recursion.sql
   ```
4. Paste into SQL Editor and click **Run**
5. Verify with the test queries at the bottom of the migration

### Option 2: Supabase CLI (If installed)

```bash
# Connect to remote database
supabase link --project-ref hymtbydkynmkyesoaucl

# Push migration to remote
supabase db push

# Or run specific migration
supabase migration up --include-all
```

### Option 3: Manual psql (Advanced)

```bash
psql "postgresql://postgres:[password]@db.hymtbydkynmkyesoaucl.supabase.co:5432/postgres" \
  -f supabase/migrations/20250113000002_fix_all_workspace_rls_recursion.sql
```

---

## Verification Steps

After applying the migration, run these tests:

### Test 1: Verify Policies Are Updated
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('workspace_members', 'workspace_invitations', 'workspaces', 'api_keys', 'audit_logs', 'system_controls')
ORDER BY tablename, policyname;
```

Expected: All policies should reference `get_user_workspace_memberships()` function.

### Test 2: Verify Function Works
```sql
SELECT * FROM get_user_workspace_memberships(auth.uid());
```

Expected: Returns your workspace memberships.

### Test 3: Test Workspace Members Query
```sql
SELECT * FROM workspace_members WHERE user_id = auth.uid();
```

Expected: Returns results without recursion error.

### Test 4: Test Invitation Creation (The Critical Test)
```sql
INSERT INTO workspace_invitations (workspace_id, email, role, token, invited_by, expires_at)
VALUES (
  'your-workspace-id',
  'test@example.com',
  'sdr',
  'test-token-' || gen_random_uuid(),
  auth.uid(),
  NOW() + INTERVAL '7 days'
);
```

Expected: Success without 42P17 error.

---

## Why Previous Fix Attempts Failed

### Migration 20250108000001_fix_workspace_invitations_rls.sql
**Issue:** Only fixed workspace_invitations INSERT policy, but didn't use SECURITY DEFINER function.

### Migration 20250108000002_fix_workspace_invitations_rls_recursion.sql
**Issue:** Fixed workspace_invitations using SECURITY DEFINER, but didn't fix workspace_members policies. The recursion still occurred because workspace_invitations policies triggered workspace_members SELECT policy.

### Migration 20250113000001_fix_workspace_members_rls_recursion.sql
**Issue:** Fixed workspace_members policies, but didn't fix workspace_invitations or other affected tables.

### Root Problem with All Three
**None of these migrations were ever applied to the remote database.** They only exist in your local git repository.

---

## The New Comprehensive Fix

**Migration:** `20250113000002_fix_all_workspace_rls_recursion.sql`

This migration:
- ✅ Fixes ALL tables at once (6 tables, 12 policies)
- ✅ Uses SECURITY DEFINER function everywhere
- ✅ Breaks ALL circular dependencies
- ✅ Includes verification queries
- ✅ Well-documented for future reference

---

## Prevention for Future Policies

### Rule of Thumb
**NEVER query workspace_members directly in RLS policies.**

### Instead, Always Use:
```sql
-- ✅ CORRECT
FROM get_user_workspace_memberships(auth.uid()) wm

-- ❌ WRONG
FROM workspace_members
WHERE user_id = auth.uid()
```

### Example Template for New Policies

```sql
-- Admin-only operation
CREATE POLICY "Admins can do something"
  ON some_table FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = some_table.workspace_id
      AND wm.role = 'admin'
    )
  );

-- Member operation
CREATE POLICY "Members can do something"
  ON some_table FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM get_user_workspace_memberships(auth.uid()) wm
    )
  );
```

---

## Summary

**Root Cause:** Cascading RLS recursion across 6 tables caused by policies that query `workspace_members` table.

**Immediate Impact:** Cannot create workspace invitations (error 42P17).

**Full Impact:** Affects 12 different operations across workspace management, invitations, API keys, audit logs, and system controls.

**Solution:** Apply migration `20250113000002_fix_all_workspace_rls_recursion.sql` to replace all broken policies with SECURITY DEFINER function-based policies.

**Status:** Migration file created and ready to apply. Must be applied to remote Supabase database via Dashboard SQL Editor, Supabase CLI, or psql.

**Next Steps:**
1. Apply migration to remote database
2. Test invitation creation
3. Verify all affected tables work correctly
4. Update documentation to prevent future RLS recursion issues

---

## Files Referenced

- **Migration to Apply:** `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20250113000002_fix_all_workspace_rls_recursion.sql`
- **Original Broken Policies:** `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/001_auth_and_workspaces.sql`
- **SECURITY DEFINER Function:** `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20250105000003_add_get_user_workspace_memberships.sql`
- **Invitation UI Code:** `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/web-app/src/components/workspace/invite-members.tsx`

---

## Questions?

If you still experience issues after applying this migration:

1. Check if `get_user_workspace_memberships()` function exists in your remote database
2. Verify the function has `SECURITY DEFINER` attribute
3. Check if grants are correct (`GRANT EXECUTE TO authenticated`)
4. Review policy definitions to ensure they match the migration

