-- Fix profiles RLS to allow workspace members to view each other
--
-- PROBLEM: Members page shows 0 members because the profiles RLS policy only
-- allows users to view their own profile. When fetching workspace members with
-- a JOIN to profiles, the query fails to return other members' profile data.
--
-- SOLUTION: Add a permissive SELECT policy that allows users to view profiles
-- of other members in their workspaces.

-- Add policy to allow viewing profiles of workspace members
CREATE POLICY "Users can view profiles of workspace members"
  ON profiles FOR SELECT
  USING (
    -- Allow viewing profiles of users who are in the same workspace
    id IN (
      SELECT wm.user_id
      FROM workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
      AND wm.status = 'active'
    )
  );

COMMENT ON POLICY "Users can view profiles of workspace members" ON profiles IS
'Allows users to view the profiles of other members in their workspaces.
This is necessary for displaying member lists, contact ownership, activity logs, etc.
Uses get_user_workspace_memberships() SECURITY DEFINER function to avoid RLS recursion.';
