-- F004: Fix workspace_members RLS policy infinite recursion
-- Migration: 20250113000001_fix_workspace_members_rls_recursion
-- Description: Use SECURITY DEFINER function to avoid infinite recursion when checking membership/admin status
-- 
-- PROBLEM: The workspace_members RLS policies query workspace_members table to check if user is a member/admin.
-- This creates circular dependency: policy checks workspace_members → triggers same policy → infinite recursion.
--
-- SOLUTION: Use get_user_workspace_memberships() SECURITY DEFINER function that bypasses RLS policies.
-- This function was created in migration 20250105000003_add_get_user_workspace_memberships.sql

-- ============================================================================
-- DROP BROKEN POLICIES
-- ============================================================================

-- Drop all existing workspace_members policies that cause infinite recursion
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can insert workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can delete workspace members" ON workspace_members;

-- ============================================================================
-- CREATE CORRECTED POLICIES USING SECURITY DEFINER FUNCTION
-- ============================================================================

-- SELECT Policy: Members can view all members in their workspaces
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM get_user_workspace_memberships(auth.uid()) wm
    )
  );

COMMENT ON POLICY "Members can view workspace members" ON workspace_members IS
'Allows members to view all members in their workspaces. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- INSERT Policy: Only admins can add new members
CREATE POLICY "Admins can insert workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can insert workspace members" ON workspace_members IS
'Allows workspace admins to add new members. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- UPDATE Policy: Only admins can update member details
CREATE POLICY "Admins can update workspace members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update workspace members" ON workspace_members IS
'Allows workspace admins to update member details. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- DELETE Policy: Only admins can remove members
CREATE POLICY "Admins can delete workspace members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can delete workspace members" ON workspace_members IS
'Allows workspace admins to remove members. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- These queries can be used to test the fix works correctly
-- Run these manually after applying the migration

-- Test 1: Check policies are created correctly
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'workspace_members'
-- ORDER BY policyname;

-- Test 2: Verify SELECT policy works (as authenticated user)
-- SET LOCAL role TO authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "your-user-id-here"}';
-- SELECT * FROM workspace_members WHERE user_id = 'your-user-id-here';
-- RESET role;

-- Test 3: Verify admin INSERT policy works
-- SET LOCAL role TO authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id"}';
-- INSERT INTO workspace_members (workspace_id, user_id, role, status)
-- VALUES ('workspace-id', 'new-user-id', 'sdr', 'active');
-- RESET role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
