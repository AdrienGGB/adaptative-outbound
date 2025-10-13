-- F004: Fix ALL workspace RLS policy infinite recursion issues
-- Migration: 20250113000002_fix_all_workspace_rls_recursion
-- Description: Comprehensive fix for ALL tables with workspace_members RLS recursion
--
-- PROBLEM: Many tables have RLS policies that query workspace_members table to check permissions.
-- This creates circular dependency: policy checks workspace_members → triggers workspace_members policy → infinite recursion.
--
-- SOLUTION: Use get_user_workspace_memberships() SECURITY DEFINER function that bypasses RLS policies.
-- This function was created in migration 20250105000003_add_get_user_workspace_memberships.sql
--
-- AFFECTED TABLES:
-- - workspace_members (SELECT, INSERT, UPDATE, DELETE)
-- - workspace_invitations (SELECT, INSERT)
-- - workspaces (SELECT)
-- - api_keys (SELECT, INSERT, UPDATE)
-- - audit_logs (SELECT)
-- - system_controls (UPDATE)

-- ============================================================================
-- PART 1: FIX workspace_members POLICIES
-- ============================================================================

-- Drop all existing workspace_members policies that cause infinite recursion
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can insert workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can delete workspace members" ON workspace_members;

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
-- PART 2: FIX workspace_invitations POLICIES
-- ============================================================================

-- Drop all existing workspace_invitations policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view workspace invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Admins can create workspace invitations" ON workspace_invitations;

-- SELECT Policy: Admins can view workspace invitations
CREATE POLICY "Admins can view workspace invitations"
  ON workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view workspace invitations" ON workspace_invitations IS
'Allows admins to view workspace invitations. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- INSERT Policy: Admins can create workspace invitations
CREATE POLICY "Admins can create workspace invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can create workspace invitations" ON workspace_invitations IS
'Allows admins to create workspace invitations. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- PART 3: FIX workspaces POLICIES
-- ============================================================================

-- Drop and recreate workspaces SELECT policy
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;

CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT wm.workspace_id
      FROM get_user_workspace_memberships(auth.uid()) wm
    )
  );

COMMENT ON POLICY "Users can view workspaces they are members of" ON workspaces IS
'Allows users to view workspaces where they are members. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- PART 4: FIX api_keys POLICIES
-- ============================================================================

-- Drop all existing api_keys policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view workspace API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can update API keys" ON api_keys;

-- SELECT Policy
CREATE POLICY "Admins can view workspace API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = api_keys.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view workspace API keys" ON api_keys IS
'Allows admins to view API keys. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- INSERT Policy
CREATE POLICY "Admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = api_keys.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can create API keys" ON api_keys IS
'Allows admins to create API keys. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- UPDATE Policy
CREATE POLICY "Admins can update API keys"
  ON api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = api_keys.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update API keys" ON api_keys IS
'Allows admins to update API keys. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- PART 5: FIX audit_logs POLICIES
-- ============================================================================

-- Drop and recreate audit_logs SELECT policy
DROP POLICY IF EXISTS "Admins can view workspace audit logs" ON audit_logs;

CREATE POLICY "Admins can view workspace audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = audit_logs.workspace_id
      AND wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view workspace audit logs" ON audit_logs IS
'Allows admins to view audit logs. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- PART 6: FIX system_controls POLICIES
-- ============================================================================

-- Drop and recreate system_controls UPDATE policy
DROP POLICY IF EXISTS "Only admins can update system controls" ON system_controls;

CREATE POLICY "Only admins can update system controls"
  ON system_controls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.role = 'admin'
    )
  );

COMMENT ON POLICY "Only admins can update system controls" ON system_controls IS
'Allows any workspace admin to update system controls. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test 1: Check all policies are created correctly
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('workspace_members', 'workspace_invitations', 'workspaces', 'api_keys', 'audit_logs', 'system_controls')
-- ORDER BY tablename, policyname;

-- Test 2: Verify function exists and works
-- SELECT * FROM get_user_workspace_memberships(auth.uid());

-- Test 3: Test workspace_members SELECT (should not cause recursion)
-- SELECT * FROM workspace_members WHERE user_id = auth.uid();

-- Test 4: Test invitation creation (should not cause recursion)
-- INSERT INTO workspace_invitations (workspace_id, email, role, token, invited_by, expires_at)
-- VALUES ('your-workspace-id', 'test@example.com', 'sdr', 'test-token-123', auth.uid(), NOW() + INTERVAL '7 days');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
