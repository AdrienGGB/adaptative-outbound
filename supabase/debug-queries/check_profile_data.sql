-- Check Your Profile Data
-- Run this in Supabase Dashboard SQL Editor

-- Query 1: Check your own profile
SELECT
  id,
  first_name,
  last_name,
  avatar_url,
  timezone,
  status,
  created_at,
  CASE
    WHEN first_name IS NULL OR first_name = '' THEN '⚠️ first_name is empty'
    ELSE '✅ first_name: ' || first_name
  END as first_name_status,
  CASE
    WHEN last_name IS NULL OR last_name = '' THEN '⚠️ last_name is empty'
    ELSE '✅ last_name: ' || last_name
  END as last_name_status
FROM profiles
WHERE id = auth.uid();

-- Query 2: Check your auth.users data
SELECT
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- Query 3: See what the members page query returns
SELECT
  wm.id,
  wm.user_id,
  wm.role,
  wm.status,
  wm.joined_at,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  au.email
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
LEFT JOIN auth.users au ON au.id = wm.user_id
WHERE wm.workspace_id IN (
  SELECT workspace_id FROM get_user_workspace_memberships(auth.uid())
)
AND wm.status = 'active';
