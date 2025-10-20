-- Test What the Members API Actually Returns
-- This simulates the exact query the frontend makes

-- ============================================================================
-- PART 1: Test the exact query structure
-- ============================================================================

-- Query 1: Simulate frontend query with explicit fields
-- This is what .select('*, profiles(*)') should return
SELECT
  wm.id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.status,
  wm.invited_by,
  wm.invited_at,
  wm.joined_at,
  wm.created_at,
  wm.updated_at,
  -- Profile data (simulating nested profiles object)
  jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'email', p.email,
    'avatar_url', p.avatar_url,
    'timezone', p.timezone,
    'status', p.status,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'last_login_at', p.last_login_at
  ) as profile
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active'
ORDER BY wm.joined_at DESC;

-- ============================================================================
-- PART 2: Check if email field exists in profiles table
-- ============================================================================

-- Query 2: Verify email column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 3: Direct profile check with email
-- ============================================================================

-- Query 3: Get profiles with email explicitly
SELECT
  id,
  first_name,
  last_name,
  email,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ============================================================================
-- PART 4: Test PostgREST query format
-- ============================================================================

-- Query 4: Test if the profile relationship returns email
-- This uses the actual FK relationship we created
SELECT
  wm.*,
  p.id as profile_id,
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.email as profile_email
FROM workspace_members wm
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active';
