# Fix: Database Error During User Signup

**Date:** October 19, 2025
**Issue:** "Database error saving new user" when trying to sign up
**Status:** ✅ RESOLVED

## Problem Summary

Users encountered a "Database error saving new user" error during signup. The issue was caused by a **race condition between two database triggers** that fire when a new user is created.

## Root Cause Analysis

### The Setup
When a user signs up via Supabase Auth, an INSERT is performed on `auth.users`, which triggers two functions:

1. **`on_auth_user_created`** → calls `handle_new_user()` → creates profile in `profiles` table
2. **`on_auth_user_create_default_workspace`** → calls `create_default_workspace_for_user()` → creates workspace and adds user to `workspace_members`

### The Problem
PostgreSQL executes triggers in **alphabetical order by trigger name**. The original trigger names caused incorrect execution order:

**Wrong Order:**
1. ❌ `on_auth_user_create_default_workspace` (ran first - tried to create workspace)
2. ✅ `on_auth_user_created` (ran second - created profile)

This caused the workspace trigger to execute BEFORE the profile was created. When it tried to insert into `workspace_members`, the foreign key constraint failed because the `user_id` didn't exist in `profiles` yet.

### Failed Solution Attempts

**Attempt 1: Add retry loop with pg_sleep()**
```sql
-- Migration: 20251019161954_fix_workspace_creation_race_condition.sql
LOOP
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = owner_user_id) INTO profile_exists;
  IF profile_exists THEN EXIT; END IF;
  retry_count := retry_count + 1;
  IF retry_count >= 10 THEN
    RAISE EXCEPTION 'Profile not found for user % after waiting', owner_user_id;
  END IF;
  PERFORM pg_sleep(0.1);
END LOOP;
```

**Why it failed:** Both triggers run within the same transaction. The profile INSERT from `handle_new_user()` hasn't been committed yet, so it's invisible to SELECT queries in the workspace trigger, even with delays.

**Attempt 2: Remove profile wait loop**
```sql
-- Migration: 20251019162506_remove_profile_wait_from_workspace_creation.sql
-- Removed the pg_sleep loop entirely
```

**Why it still failed:** Trigger execution order was still wrong - workspace trigger was still running before profile trigger.

## The Solution

**Two-part fix:**

### Part 1: Remove Profile Wait Logic
The `pg_sleep()` retry loop doesn't work within the same transaction, so it was removed entirely.

**Migration:** `20251019162506_remove_profile_wait_from_workspace_creation.sql`

```sql
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  workspace_name TEXT,
  workspace_slug TEXT,
  owner_user_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create the workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (workspace_name, workspace_slug, owner_user_id)
  RETURNING id INTO new_workspace_id;

  -- Add owner as admin member
  -- No need to check if profile exists - it's being created in the same transaction
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (new_workspace_id, owner_user_id, 'admin', 'active', NOW());

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql;
```

### Part 2: Fix Trigger Execution Order
Renamed the workspace trigger to ensure it runs AFTER the profile trigger.

**Migration:** `20251019162617_fix_trigger_execution_order.sql`

```sql
-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_create_default_workspace ON auth.users;

-- Recreate with a name that ensures it runs AFTER on_auth_user_created
CREATE TRIGGER zzz_create_default_workspace_after_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_workspace_for_user();
```

**New Correct Order:**
1. ✅ `on_auth_user_created` (creates profile first)
2. ✅ `zzz_create_default_workspace_after_profile` (creates workspace second)

## Verification

### Test Results

**Test User:** test-fresh-signup@example.com
**User ID:** 98ab69da-69c9-4876-87e3-2e32db13c113

✅ **Profile Created:**
```
id: 98ab69da-69c9-4876-87e3-2e32db13c113
email: test-fresh-signup@example.com
first_name: Sarah
last_name: Johnson
```

✅ **Workspace Created:**
```
id: c136b319-c0bd-48b6-9d9d-818d8e234f23
name: test-fresh-signup's Workspace
slug: test-fresh-signup-workspace-98ab69da
owner_id: 98ab69da-69c9-4876-87e3-2e32db13c113
```

✅ **Workspace Membership Created:**
```
workspace_id: c136b319-c0bd-48b6-9d9d-818d8e234f23
user_id: 98ab69da-69c9-4876-87e3-2e32db13c113
role: admin
status: active
```

### Database Logs
✅ No errors in database logs after signup

## Key Learnings

1. **PostgreSQL trigger execution order** is alphabetical by trigger name, not by creation order or explicit priority
2. **Within a transaction**, uncommitted changes are not visible to other queries, even with delays
3. **Foreign key constraints** rely on the referenced row existing in the same transaction
4. **Trigger naming conventions** should explicitly indicate execution order when order matters (e.g., using prefixes like `aaa_` or `zzz_`)

## Files Modified

- `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20251019161954_fix_workspace_creation_race_condition.sql` - Initial failed attempt
- `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20251019162506_remove_profile_wait_from_workspace_creation.sql` - Remove sleep loop
- `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/20251019162617_fix_trigger_execution_order.sql` - Fix trigger order (THE FIX)

## Testing Commands

```bash
# Test signup via API
curl -X POST 'http://127.0.0.1:54331/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123","data":{"first_name":"John","last_name":"Doe"}}'

# Verify profile created
docker exec supabase_db_Adaptive_Outbound psql -U postgres -d postgres \
  -c "SELECT * FROM profiles WHERE email = 'test@example.com';"

# Verify workspace created
docker exec supabase_db_Adaptive_Outbound psql -U postgres -d postgres \
  -c "SELECT w.* FROM workspaces w JOIN profiles p ON w.owner_id = p.id WHERE p.email = 'test@example.com';"

# Verify workspace membership created
docker exec supabase_db_Adaptive_Outbound psql -U postgres -d postgres \
  -c "SELECT wm.* FROM workspace_members wm JOIN profiles p ON wm.user_id = p.id WHERE p.email = 'test@example.com';"
```

## Next Steps

- ✅ User signup now works without errors
- ✅ Profile, workspace, and workspace membership are all created automatically
- Consider documenting trigger execution order best practices for the team
- Consider adding integration tests for signup flow
