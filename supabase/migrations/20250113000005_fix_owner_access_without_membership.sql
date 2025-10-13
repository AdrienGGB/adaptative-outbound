-- Fix RLS policies to support workspace owner access without requiring membership
--
-- DESIGN DECISION: Owners should have full access to their workspaces WITHOUT
-- needing to be in the workspace_members table. Owners can optionally add
-- themselves as members if they want an operational role.
--
-- SOLUTION: Update get_user_workspace_memberships() function and all RLS policies
-- to check BOTH workspace_members AND workspaces.owner_id

-- ============================================================================
-- PART 1: Update get_user_workspace_memberships to include owned workspaces
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_workspace_memberships(p_user_id UUID)
RETURNS TABLE (
  workspace_id UUID,
  role VARCHAR,
  workspace_name VARCHAR,
  workspace_slug VARCHAR,
  workspace_plan VARCHAR,
  workspace_seats_limit INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Get workspaces where user is a member
  SELECT
    wm.workspace_id,
    wm.role,
    w.name as workspace_name,
    w.slug as workspace_slug,
    w.plan as workspace_plan,
    w.seats_limit as workspace_seats_limit
  FROM workspace_members wm
  JOIN workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = p_user_id
    AND wm.status = 'active'

  UNION

  -- Get workspaces where user is the owner (even if not a member)
  SELECT
    w.id as workspace_id,
    'admin'::VARCHAR as role,  -- Owners always have admin-level access
    w.name as workspace_name,
    w.slug as workspace_slug,
    w.plan as workspace_plan,
    w.seats_limit as workspace_seats_limit
  FROM workspaces w
  WHERE w.owner_id = p_user_id
    -- Only include if NOT already a member (to avoid duplicates)
    AND NOT EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = w.id
      AND wm.user_id = p_user_id
      AND wm.status = 'active'
    );
END;
$$;

COMMENT ON FUNCTION get_user_workspace_memberships(UUID) IS
'Returns all active workspace memberships for a user with workspace details.
Includes BOTH workspaces where user is a member AND workspaces where user is the owner.
Uses SECURITY DEFINER to bypass RLS policies and avoid circular dependency.
Owners get admin-level access even without being in workspace_members table.';

-- ============================================================================
-- PART 2: Update workspace_members SELECT policy to allow owners to view members
-- ============================================================================

-- Drop the current policy
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Recreate with owner support
CREATE POLICY "Members and owners can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM get_user_workspace_memberships(auth.uid()) wm
    )
  );

COMMENT ON POLICY "Members and owners can view workspace members" ON workspace_members IS
'Allows both workspace members AND owners to view all members in their workspaces.
Uses get_user_workspace_memberships() which includes owned workspaces.';

-- ============================================================================
-- PART 3: Update profiles policy to allow owners to view member profiles
-- ============================================================================

-- Drop the current policy
DROP POLICY IF EXISTS "Users can view profiles of workspace members" ON profiles;

-- Recreate with owner support
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
Includes workspaces where user is owner (via get_user_workspace_memberships).
This is necessary for displaying member lists, contact ownership, activity logs, etc.';

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

-- The following queries should now work for owners:
-- SELECT * FROM get_user_workspace_memberships(auth.uid());
-- SELECT * FROM workspace_members WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid());
-- SELECT * FROM workspaces WHERE owner_id = auth.uid();
