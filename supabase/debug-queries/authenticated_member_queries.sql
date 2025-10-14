-- Authenticated Member Debugging Queries
--
-- IMPORTANT: These queries must be run with proper authentication context.
-- In Supabase Dashboard SQL Editor, these will work because the editor
-- runs queries in the context of the logged-in dashboard user.
--
-- If auth.uid() returns NULL, it means:
-- 1. You're not authenticated, OR
-- 2. You're running in a context without JWT authentication

-- ============================================================================
-- PART 1: Authentication & User Context
-- ============================================================================

-- Query 1: Check your current authenticated user ID
-- This should return your user UUID, NOT NULL
SELECT
  auth.uid() as your_user_id,
  auth.email() as your_email,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED - Queries will fail'
    ELSE '✅ Authenticated'
  END as auth_status;

-- Query 2: Check your profile
SELECT
  id,
  first_name,
  last_name,
  status,
  created_at
FROM profiles
WHERE id = auth.uid();

-- ============================================================================
-- PART 2: Workspace Membership Debugging
-- ============================================================================

-- Query 3: Check ALL workspace memberships (via helper function)
-- This includes both direct memberships AND owned workspaces
SELECT
  workspace_id,
  role,
  workspace_name,
  workspace_slug,
  workspace_plan,
  workspace_seats_limit
FROM get_user_workspace_memberships(auth.uid())
ORDER BY workspace_name;

-- Query 4: Check direct workspace memberships (workspace_members table)
SELECT
  wm.id,
  wm.workspace_id,
  w.name as workspace_name,
  wm.role,
  wm.status,
  wm.joined_at,
  wm.created_at
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid()
ORDER BY wm.joined_at DESC;

-- Query 5: Check owned workspaces (where you're the owner)
SELECT
  id as workspace_id,
  name as workspace_name,
  slug,
  plan,
  seats_limit,
  owner_id,
  created_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
    ) THEN '✅ Also a member'
    ELSE '⚠️  Owner only (not in members table)'
  END as membership_status
FROM workspaces
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- ============================================================================
-- PART 3: Member Count Investigation
-- ============================================================================

-- Query 6: Member count by workspace (what the database actually has)
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  w.owner_id,
  COUNT(wm.id) FILTER (WHERE wm.status = 'active') as active_member_count,
  COUNT(wm.id) FILTER (WHERE wm.status = 'invited') as invited_count,
  COUNT(wm.id) as total_count,
  ARRAY_AGG(
    wm.user_id || ' (' || wm.role || ')'
    ORDER BY wm.joined_at DESC
  ) FILTER (WHERE wm.status = 'active') as active_members
FROM workspaces w
LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
WHERE w.id IN (
  SELECT workspace_id FROM get_user_workspace_memberships(auth.uid())
)
GROUP BY w.id, w.name, w.owner_id
ORDER BY w.name;

-- Query 7: Detailed member list for a specific workspace
-- Replace 'YOUR-WORKSPACE-ID' with actual workspace ID
-- SELECT
--   wm.id,
--   wm.user_id,
--   wm.role,
--   wm.status,
--   wm.joined_at,
--   p.first_name,
--   p.last_name,
--   CASE
--     WHEN p.id IS NULL THEN '❌ Profile missing'
--     ELSE '✅ Profile found'
--   END as profile_status
-- FROM workspace_members wm
-- LEFT JOIN profiles p ON p.id = wm.user_id
-- WHERE wm.workspace_id = 'YOUR-WORKSPACE-ID'
-- ORDER BY wm.joined_at DESC;

-- ============================================================================
-- PART 4: RLS Policy Verification
-- ============================================================================

-- Query 8: Test if you can see workspace members
-- This tests the RLS policy on workspace_members
SELECT
  wm.id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.status,
  w.name as workspace_name
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.workspace_id IN (
  SELECT workspace_id FROM get_user_workspace_memberships(auth.uid())
)
AND wm.status = 'active'
ORDER BY w.name, wm.joined_at DESC;

-- Query 9: Test if you can see workspace member profiles
-- This tests BOTH workspace_members RLS AND profiles RLS
SELECT
  wm.id as member_id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  w.name as workspace_name,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  CASE
    WHEN p.id IS NULL THEN '❌ Cannot see profile (RLS blocked)'
    ELSE '✅ Can see profile'
  END as rls_status
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.workspace_id IN (
  SELECT workspace_id FROM get_user_workspace_memberships(auth.uid())
)
AND wm.status = 'active'
ORDER BY w.name, wm.joined_at DESC;

-- ============================================================================
-- PART 5: PostgREST Query Simulation
-- ============================================================================

-- Query 10: Simulate what the frontend query should return
-- This is equivalent to: .select('*, profiles(*)')
SELECT
  wm.*,
  row_to_json(p.*) as profile
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.workspace_id IN (
  SELECT workspace_id FROM get_user_workspace_memberships(auth.uid())
)
AND wm.status = 'active'
ORDER BY wm.joined_at DESC;

-- ============================================================================
-- PART 6: RLS Policy Inspection
-- ============================================================================

-- Query 11: View all RLS policies on workspace_members
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'workspace_members'
ORDER BY policyname;

-- Query 12: View all RLS policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

/*
ISSUE: auth.uid() returns NULL
SOLUTION:
  - Make sure you're logged into Supabase Dashboard
  - Run queries in the SQL Editor (not via external tools)
  - The Dashboard automatically authenticates queries

ISSUE: Member count shows 0 but you created members
SOLUTION:
  - Check Query 6 above to see actual member counts
  - Verify RLS policies allow you to see members (Query 8)
  - Check if you're the owner but not a member (Query 5)

ISSUE: Cannot see member profiles (names show as N/A)
SOLUTION:
  - Run Query 9 to test profile visibility
  - Check profiles RLS policies (Query 12)
  - Verify the profiles table has data for members

ISSUE: 400 Bad Request on .select('*, profiles(*)')
SOLUTION:
  - Apply migration 20250114000001_add_workspace_members_profile_fk.sql
  - This adds the missing FK relationship for PostgREST
  - After migration, the query should work

ISSUE: Member count differs between home page and members page
SOLUTION:
  - Check Query 6 for actual counts
  - Verify both pages use same filtering (status = 'active')
  - Check if owner is counted differently on each page
*/
