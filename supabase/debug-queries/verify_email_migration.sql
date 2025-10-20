-- Verify Email Migration Applied Successfully
-- Run this in Supabase Dashboard SQL Editor

-- ============================================================================
-- OPTION 1: Check ALL profiles (works without authentication)
-- ============================================================================

-- Query 1: See all profiles with email status
SELECT
  id,
  first_name,
  last_name,
  email,
  created_at,
  CASE
    WHEN email IS NULL OR email = '' THEN '❌ Missing email'
    ELSE '✅ Has email: ' || email
  END as email_status
FROM profiles
ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 2: Check specific user by email
-- ============================================================================

-- Query 2: Find your profile by email (replace with your email)
-- SELECT
--   id,
--   first_name,
--   last_name,
--   email,
--   created_at
-- FROM profiles
-- WHERE email = 'your-email@example.com';

-- ============================================================================
-- OPTION 3: Check workspace members with emails
-- ============================================================================

-- Query 3: See all workspace members with their emails
SELECT
  wm.id as member_id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.status,
  p.first_name,
  p.last_name,
  p.email,
  w.name as workspace_name,
  CASE
    WHEN p.email IS NULL OR p.email = '' THEN '❌ Missing email'
    ELSE '✅ Has email'
  END as email_status
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN profiles p ON p.id = wm.user_id
WHERE wm.status = 'active'
ORDER BY w.name, wm.joined_at DESC;

-- ============================================================================
-- OPTION 4: Verify migration worked by counting
-- ============================================================================

-- Query 4: Count profiles with and without email
SELECT
  COUNT(*) as total_profiles,
  COUNT(email) FILTER (WHERE email IS NOT NULL AND email != '') as profiles_with_email,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') as profiles_without_email
FROM profiles;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

/*
SCENARIO 1: All profiles show "Missing email"
CAUSE: Migration didn't run or failed
SOLUTION: Re-run migration 20250114000002_add_email_to_profiles.sql

SCENARIO 2: Some profiles have email, some don't
CAUSE: Migration ran but some auth.users don't have emails (OAuth users, etc.)
SOLUTION: Check auth.users table:
  SELECT id, email FROM auth.users WHERE email IS NULL OR email = '';

SCENARIO 3: No rows in profiles table
CAUSE: No users have signed up yet, OR viewing wrong database
SOLUTION:
  1. Check you're in the correct Supabase project
  2. Check auth.users has users: SELECT COUNT(*) FROM auth.users;

SCENARIO 4: Query returns "No rows" even though you have profiles
CAUSE: Using auth.uid() without authentication context
SOLUTION: Use Query 1, 3, or 4 above (they don't need auth.uid())
*/
