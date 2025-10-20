-- Find Members Without Profiles
--
-- This query helps diagnose why some workspace members don't have profiles
-- Run this in Supabase Dashboard SQL Editor

-- ============================================================================
-- PART 1: Find members without profiles
-- ============================================================================

-- Query 1: Count members with and without profiles
SELECT
  COUNT(*) as total_members,
  COUNT(p.id) as members_with_profiles,
  COUNT(*) - COUNT(p.id) as members_without_profiles
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active';

-- Query 2: List specific members without profiles
SELECT
  wm.id as member_id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.status,
  wm.joined_at,
  wm.created_at,
  w.name as workspace_name,
  CASE
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ Has profile'
  END as profile_status
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active'
  AND p.id IS NULL
ORDER BY wm.created_at DESC;

-- Query 3: Check if auth.users exist for these members
SELECT
  wm.id as member_id,
  wm.user_id,
  wm.role,
  w.name as workspace_name,
  CASE
    WHEN au.id IS NULL THEN '❌ NO AUTH USER (data corruption!)'
    WHEN p.id IS NULL THEN '⚠️  AUTH USER EXISTS but NO PROFILE'
    ELSE '✅ Both exist'
  END as status,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN auth.users au ON au.id = wm.user_id
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active'
  AND p.id IS NULL
ORDER BY wm.created_at DESC;

-- ============================================================================
-- PART 2: Root Cause Analysis
-- ============================================================================

-- Query 4: Check if profile auto-creation trigger is working
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Query 5: Check if trigger is attached to auth.users
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- PART 3: Fix Missing Profiles
-- ============================================================================

-- Query 6: Create missing profiles for auth users that don't have them
-- IMPORTANT: Review the SELECT query first, then uncomment INSERT to fix

-- First, see what would be created:
SELECT
  au.id,
  au.email,
  au.created_at,
  'Would create profile for this user' as action
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- If the above looks correct, uncomment and run this to fix:
/*
INSERT INTO profiles (id, first_name, last_name, created_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;
*/

-- Query 7: Verify the fix worked
-- Run this after creating profiles
SELECT
  COUNT(*) as total_members,
  COUNT(p.id) as members_with_profiles,
  COUNT(*) - COUNT(p.id) as members_without_profiles
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active';

-- ============================================================================
-- PART 4: Prevent Future Issues
-- ============================================================================

-- Query 8: Test the trigger by checking recent users
-- This verifies new users are getting profiles automatically
SELECT
  au.id,
  au.email,
  au.created_at as user_created,
  p.id as profile_id,
  p.created_at as profile_created,
  CASE
    WHEN p.id IS NULL THEN '❌ Missing profile (trigger not working!)'
    ELSE '✅ Profile created'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

/*
SCENARIO 1: Members without profiles but auth.users exist
CAUSE: Profile auto-creation trigger failed or wasn't in place when users were created
SOLUTION: Run Query 6 to create missing profiles

SCENARIO 2: Members without profiles and NO auth.users
CAUSE: Data corruption - workspace_members references non-existent users
SOLUTION:
  1. Investigate why user was deleted
  2. Remove orphaned workspace_members records:
     DELETE FROM workspace_members WHERE user_id NOT IN (SELECT id FROM auth.users);
  3. Check FK constraints are properly set up

SCENARIO 3: Trigger exists but not creating profiles for new users
CAUSE: Trigger might be disabled or has errors
SOLUTION:
  1. Check trigger exists (Query 5)
  2. Check function exists (Query 4)
  3. Re-create trigger and function from migration 001_auth_and_workspaces.sql

SCENARIO 4: RLS prevents seeing profiles
CAUSE: Profile RLS policies too restrictive
SOLUTION:
  1. Check profiles RLS policies
  2. Ensure "Users can view profiles of workspace members" policy allows access
  3. Run queries from authenticated_member_queries.sql to test

RECOMMENDED ACTIONS:
1. Run Query 1 to see how many members lack profiles
2. Run Query 3 to understand the root cause
3. Run Query 6 (SELECT first) to see what would be fixed
4. Run Query 6 (INSERT commented code) to fix missing profiles
5. Run Query 7 to verify fix worked
6. Test members page in the app
*/
