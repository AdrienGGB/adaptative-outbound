-- F004 Workspace Creation Flow - Test Script
-- ============================================

-- Test 1: Check existing users
\echo '=== Test 1: Existing Users ==='
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Test 2: Check existing workspaces
\echo '\n=== Test 2: Existing Workspaces ==='
SELECT id, name, slug, owner_id, created_at FROM workspaces ORDER BY created_at DESC LIMIT 5;

-- Test 3: Check workspace memberships
\echo '\n=== Test 3: Workspace Memberships ==='
SELECT
  wm.user_id,
  wm.workspace_id,
  wm.role,
  w.name as workspace_name,
  p.email as user_email
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN profiles p ON p.id = wm.user_id
ORDER BY wm.created_at DESC
LIMIT 10;

-- Test 4: Verify create_workspace_with_owner function exists
\echo '\n=== Test 4: Function Existence ==='
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_workspace_with_owner';

-- Test 5: Database consistency checks
\echo '\n=== Test 5: Consistency Checks ==='

-- Count users
SELECT COUNT(*) as total_users FROM auth.users;

-- Count workspaces
SELECT COUNT(*) as total_workspaces FROM workspaces;

-- Count memberships
SELECT COUNT(*) as total_members FROM workspace_members;

-- Orphaned workspaces (should be 0)
\echo '\n=== Orphaned Workspaces (should be empty) ==='
SELECT w.id, w.name, w.slug FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.id IS NULL;

-- Users without workspaces (should be 0)
\echo '\n=== Users Without Workspaces (should be empty) ==='
SELECT u.id, u.email FROM auth.users u
LEFT JOIN workspace_members wm ON u.id = wm.user_id
WHERE wm.id IS NULL;

-- Test 6: Check RLS policies on workspaces table
\echo '\n=== Test 6: RLS Policies ==='
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workspaces'
ORDER BY policyname;
