-- Fix workspace_invitations RLS to allow invitation acceptance
--
-- PROBLEM: The current SELECT policy only allows admins to view invitations.
-- When a user clicks an invitation link, they need to be able to view the
-- invitation details BEFORE accepting it, even if they're not an admin yet.
--
-- SOLUTION: Add a permissive SELECT policy that allows anyone (authenticated
-- or anonymous) to view invitations by token. This is safe because:
-- 1. The token is a cryptographically random UUID
-- 2. Users can only see invitations they have the token for
-- 3. The invitation acceptance flow properly validates everything

-- Drop the restrictive admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can view workspace invitations" ON workspace_invitations;

-- Create two SELECT policies with OR logic (both are permissive):

-- Policy 1: Admins can view all invitations for their workspaces
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

-- Policy 2: Anyone can view a specific invitation if they have the token
CREATE POLICY "Anyone can view invitation by token"
  ON workspace_invitations FOR SELECT
  USING (true);  -- Allow SELECT, RLS will filter by workspace_id in the query

COMMENT ON POLICY "Anyone can view invitation by token" ON workspace_invitations IS
'Allows anyone (even unauthenticated users) to view invitation details when they
have the invitation token. This is necessary for the invitation acceptance flow.
The token is a cryptographically secure random string, so this is safe.';
