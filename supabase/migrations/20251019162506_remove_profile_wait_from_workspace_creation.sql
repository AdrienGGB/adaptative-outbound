-- Remove profile wait loop from workspace creation
--
-- ROOT CAUSE ANALYSIS:
-- The previous fix attempted to wait for the profile using pg_sleep() in a retry loop.
-- However, this doesn't work because both triggers (handle_new_user and
-- create_default_workspace_for_user) run in the SAME TRANSACTION.
--
-- Within a single transaction, uncommitted INSERTs from one trigger are NOT visible
-- to SELECT queries in another trigger, even with pg_sleep() delays.
--
-- THE CORRECT SOLUTION:
-- Remove the profile existence check entirely. The profile IS being created by
-- handle_new_user trigger in the same transaction. The foreign key constraint
-- on workspace_members.user_id will ensure data integrity. Since both triggers
-- are AFTER INSERT triggers on auth.users, and they run synchronously in the
-- same transaction, we can safely insert into workspace_members knowing the
-- profile row exists (even if not yet committed).

DROP FUNCTION IF EXISTS public.create_workspace_with_owner(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  workspace_name TEXT,
  workspace_slug TEXT,
  owner_user_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create the workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (workspace_name, workspace_slug, owner_user_id)
  RETURNING id INTO new_workspace_id;

  -- Add owner as admin member
  -- No need to check if profile exists - it's being created in the same transaction
  -- by the handle_new_user trigger. The foreign key constraint ensures integrity.
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (new_workspace_id, owner_user_id, 'admin', 'active', NOW());

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner TO authenticated, service_role, supabase_auth_admin;

COMMENT ON FUNCTION public.create_workspace_with_owner IS 'Creates a workspace and adds the owner as admin. Relies on handle_new_user trigger creating the profile in the same transaction.';
