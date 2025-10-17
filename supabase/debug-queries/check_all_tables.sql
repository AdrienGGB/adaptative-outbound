-- Check All Tables in Database
-- Run this in Supabase Dashboard SQL Editor

-- ============================================================================
-- PART 1: List ALL tables in public schema
-- ============================================================================

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- PART 2: Expected tables from our schema
-- ============================================================================

-- These tables SHOULD exist based on our migrations:
-- From 001_auth_and_workspaces.sql:
--   - profiles
--   - workspaces
--   - workspace_members
--   - workspace_invitations
--   - user_sessions
--   - api_keys
--   - audit_logs
--   - system_controls

-- From 003_core_data_schema.sql:
--   - accounts
--   - contacts
--   - tags
--   - account_tags
--   - contact_tags
--   - activities
--   - tasks
--   - sequences
--   - sequence_steps
--   - sequence_enrollments
--   - custom_fields
--   - custom_field_values

-- ============================================================================
-- PART 3: Check specific critical tables
-- ============================================================================

-- Check if core tables exist
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN '✅' ELSE '❌ MISSING' END as profiles,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN '✅' ELSE '❌ MISSING' END as workspaces,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspace_members') THEN '✅' ELSE '❌ MISSING' END as workspace_members,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN '✅' ELSE '❌ MISSING' END as accounts,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN '✅' ELSE '❌ MISSING' END as contacts,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN '✅' ELSE '❌ MISSING' END as activities,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN '✅' ELSE '❌ MISSING' END as tasks,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sequences') THEN '✅' ELSE '❌ MISSING' END as sequences;

-- ============================================================================
-- PART 4: Count rows in existing tables
-- ============================================================================

-- This will show which tables exist and have data
DO $$
DECLARE
  r RECORD;
  row_count INTEGER;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO row_count;
    RAISE NOTICE '% : % rows', r.table_name, row_count;
  END LOOP;
END $$;
