-- DEPRECATED: This file has been replaced with authenticated_member_queries.sql
--
-- The queries in this file were causing confusion because:
-- 1. auth.uid() returns NULL when run outside authenticated context
-- 2. The new file has better documentation and troubleshooting
--
-- Please use: supabase/debug-queries/authenticated_member_queries.sql
--
-- ============================================================================
-- OLD QUERIES (kept for reference but use new file instead)
-- ============================================================================

-- 1. Check your current user ID
-- NOTE: This will return NULL if not properly authenticated
SELECT auth.uid() as current_user_id;

-- 2. Check workspace_members count (what home page sees)
SELECT
  workspace_id,
  COUNT(*) as member_count
FROM workspace_members
WHERE status = 'active'
GROUP BY workspace_id;

-- 3. Check workspace_members with profiles JOIN (what members page sees)
SELECT
  wm.id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.status,
  wm.joined_at,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.email
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active';

-- 4. Check if get_user_workspace_memberships function returns correct data
SELECT * FROM get_user_workspace_memberships(auth.uid());

-- 5. Check profiles RLS policies
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
WHERE tablename = 'profiles';

-- 6. Test if you can see your own profile
SELECT * FROM profiles WHERE id = auth.uid();

-- 7. Test if you can see other workspace members' profiles
SELECT p.*
FROM profiles p
WHERE p.id IN (
  SELECT wm.user_id
  FROM workspace_members wm
  WHERE wm.workspace_id IN (
    SELECT workspace_id
    FROM get_user_workspace_memberships(auth.uid())
  )
  AND wm.status = 'active'
);
