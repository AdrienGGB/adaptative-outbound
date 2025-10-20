-- Fix: Add DELETE policy for workspaces
-- Bug: Users cannot delete workspaces because there's no DELETE RLS policy
-- Solution: Allow workspace owners and admin members to delete workspaces

-- ============================================================================
-- ADD DELETE POLICY FOR WORKSPACES
-- ============================================================================

-- Allow workspace owners OR admin members to delete workspaces
CREATE POLICY "Workspace owners and admins can delete workspace"
  ON workspaces FOR DELETE
  USING (
    -- Owner can delete
    auth.uid() = owner_id
    OR
    -- Admin members can delete
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- ============================================================================
-- IMPROVE UPDATE POLICY (Optional - allow admins to update, not just owners)
-- ============================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Workspace owners can update their workspace" ON workspaces;

-- Create new policy that allows both owners and admin members to update
CREATE POLICY "Workspace owners and admins can update workspace"
  ON workspaces FOR UPDATE
  USING (
    -- Owner can update
    auth.uid() = owner_id
    OR
    -- Admin members can update
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- With this policy in place:
-- 1. Workspace owners can delete workspaces
-- 2. Admin members can delete workspaces
-- 3. All related data will cascade delete thanks to ON DELETE CASCADE foreign keys:
--    - workspace_members
--    - workspace_invitations
--    - user_sessions
--    - api_keys
--    - workspace_settings
--    - jobs
--    - accounts, contacts, activities (from core data schema)
--    - etc.

-- The frontend can now choose between:
-- A) Soft delete: UPDATE workspaces SET status = 'deleted' WHERE id = ...
-- B) Hard delete: DELETE FROM workspaces WHERE id = ...

-- Both approaches are now permitted by RLS policies.
