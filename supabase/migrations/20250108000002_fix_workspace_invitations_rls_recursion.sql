-- F004: Fix workspace invitations RLS policy infinite recursion
-- Migration: 20250108000002_fix_workspace_invitations_rls_recursion
-- Description: Use SECURITY DEFINER function to avoid infinite recursion when checking admin status

-- Drop the broken policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can create workspace invitations" ON workspace_invitations;

-- Create a corrected policy using the get_user_workspace_memberships() function
-- This function uses SECURITY DEFINER to bypass RLS policies and avoid circular dependencies
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

-- Add comment explaining the fix
COMMENT ON POLICY "Admins can create workspace invitations" ON workspace_invitations IS
'Allows admins to create workspace invitations. Uses get_user_workspace_memberships()
SECURITY DEFINER function to bypass RLS policies and avoid infinite recursion.';
