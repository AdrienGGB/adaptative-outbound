-- F004: Fix workspace invitations RLS policy
-- Migration: 20250108000001_fix_workspace_invitations_rls
-- Description: Fix the INSERT policy for workspace_invitations to properly reference the workspace_id being inserted

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can create workspace invitations" ON workspace_invitations;

-- Create a corrected policy that properly references the workspace_id from the NEW row
CREATE POLICY "Admins can create workspace invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
