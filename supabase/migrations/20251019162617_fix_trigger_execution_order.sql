-- Fix trigger execution order to ensure profile is created before workspace
--
-- ISSUE:
-- PostgreSQL executes triggers in alphabetical order by trigger name.
-- Current order:
--   1. on_auth_user_create_default_workspace (creates workspace - WRONG, runs first!)
--   2. on_auth_user_created (creates profile - should run first!)
--
-- This causes workspace creation to fail because it tries to insert into
-- workspace_members with a user_id that doesn't exist in profiles yet.
--
-- SOLUTION:
-- Rename the workspace trigger to run AFTER the profile trigger alphabetically.
-- Using prefix 'zzz_' to ensure it runs last.

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_create_default_workspace ON auth.users;

-- Recreate with a name that ensures it runs AFTER on_auth_user_created
CREATE TRIGGER zzz_create_default_workspace_after_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_workspace_for_user();
