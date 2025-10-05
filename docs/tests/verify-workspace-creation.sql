-- ============================================
-- F004 Workspace Creation - Verification Script
-- ============================================
-- Run this script to verify workspace creation is working
-- Usage: docker exec -i supabase_db_Adaptive_Outbound psql -U postgres -d postgres < verify-workspace-creation.sql

\echo '========================================='
\echo 'F004 Workspace Creation Verification'
\echo '========================================='
\echo ''

-- 1. Check Users
\echo '1. USERS:'
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
\echo ''

-- 2. Check Workspaces
\echo '2. WORKSPACES:'
SELECT id, name, slug, owner_id, created_at FROM workspaces ORDER BY created_at DESC;
\echo ''

-- 3. Check Memberships
\echo '3. WORKSPACE MEMBERSHIPS:'
SELECT
  wm.id,
  u.email as user_email,
  w.name as workspace_name,
  wm.role,
  wm.status,
  wm.created_at
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN auth.users u ON u.id = wm.user_id
ORDER BY wm.created_at DESC;
\echo ''

-- 4. Database Consistency
\echo '4. CONSISTENCY CHECK:'
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM workspaces) as total_workspaces,
  (SELECT COUNT(*) FROM workspace_members) as total_memberships,
  (SELECT COUNT(*) FROM workspaces w
   LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
   WHERE wm.id IS NULL) as orphaned_workspaces,
  (SELECT COUNT(*) FROM auth.users u
   LEFT JOIN workspace_members wm ON u.id = wm.user_id
   WHERE wm.id IS NULL) as users_without_workspace;
\echo ''

-- 5. Function Existence
\echo '5. REQUIRED FUNCTIONS:'
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('create_workspace_with_owner', 'create_default_workspace_for_user', 'handle_new_user')
ORDER BY p.proname;
\echo ''

-- 6. Triggers
\echo '6. USER SIGNUP TRIGGERS:'
SELECT
  trigger_name,
  event_manipulation as event,
  action_statement as action
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;
\echo ''

-- 7. RLS Policies
\echo '7. RLS POLICIES ON WORKSPACES:'
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'View workspaces'
    WHEN cmd = 'INSERT' THEN 'Create workspaces'
    WHEN cmd = 'UPDATE' THEN 'Update workspaces'
    WHEN cmd = 'DELETE' THEN 'Delete workspaces'
  END as permission
FROM pg_policies
WHERE tablename = 'workspaces'
ORDER BY policyname;
\echo ''

-- 8. Summary
\echo '8. SUMMARY:'
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM auth.users) as users,
    (SELECT COUNT(*) FROM workspaces) as workspaces,
    (SELECT COUNT(*) FROM workspace_members) as memberships,
    (SELECT COUNT(*) FROM workspaces w
     LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.id IS NULL) as orphaned,
    (SELECT COUNT(*) FROM auth.users u
     LEFT JOIN workspace_members wm ON u.id = wm.user_id
     WHERE wm.id IS NULL) as no_workspace
)
SELECT
  'Database Status' as check_name,
  CASE
    WHEN users > 0 AND workspaces > 0 AND memberships = workspaces AND orphaned = 0 AND no_workspace = 0
    THEN '✅ HEALTHY'
    ELSE '❌ ISSUES FOUND'
  END as status,
  users || ' users, ' || workspaces || ' workspaces, ' || memberships || ' memberships' as details
FROM stats;

\echo ''
\echo '========================================='
\echo 'Verification Complete'
\echo '========================================='
\echo ''
\echo 'Expected Results:'
\echo '  - All users should have at least one workspace'
\echo '  - All workspaces should have at least one member'
\echo '  - Total memberships should equal total workspaces (for new setups)'
\echo '  - Orphaned workspaces: 0'
\echo '  - Users without workspace: 0'
\echo ''
