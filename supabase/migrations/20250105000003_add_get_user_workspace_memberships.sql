-- Create function to get user workspace memberships
-- This function bypasses RLS policies to avoid circular dependencies
-- when checking workspace_members table

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
    AND wm.status = 'active';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_workspace_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_workspace_memberships(UUID) TO anon;

-- Add comment explaining the function
COMMENT ON FUNCTION get_user_workspace_memberships(UUID) IS
'Returns all active workspace memberships for a user with workspace details.
Uses SECURITY DEFINER to bypass RLS policies and avoid circular dependency
where workspace_members SELECT policy checks workspace_members table.';
