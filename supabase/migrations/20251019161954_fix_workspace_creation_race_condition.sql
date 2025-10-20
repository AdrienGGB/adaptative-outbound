-- Fix workspace creation race condition
-- The issue: Two triggers are racing - handle_new_user creates profile, 
-- and create_default_workspace_for_user tries to add workspace member.
--
-- Solution: Wait for profile to exist before adding to workspace_members,
-- but don't try to create it ourselves (let handle_new_user do that)

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
  profile_exists BOOLEAN;
  retry_count INT := 0;
BEGIN
  -- Wait for profile to exist (created by handle_new_user trigger)
  -- Retry up to 10 times with 100ms delay
  LOOP
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = owner_user_id) INTO profile_exists;
    
    IF profile_exists THEN
      EXIT;
    END IF;
    
    retry_count := retry_count + 1;
    IF retry_count >= 10 THEN
      RAISE EXCEPTION 'Profile not found for user % after waiting', owner_user_id;
    END IF;
    
    -- Wait 100ms before retrying
    PERFORM pg_sleep(0.1);
  END LOOP;

  -- Create the workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (workspace_name, workspace_slug, owner_user_id)
  RETURNING id INTO new_workspace_id;

  -- Add owner as admin member (profile is guaranteed to exist now)
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (new_workspace_id, owner_user_id, 'admin', 'active', NOW());

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner TO authenticated, service_role, supabase_auth_admin;

COMMENT ON FUNCTION public.create_workspace_with_owner IS 'Creates a workspace and adds the owner as admin. Waits for profile to be created by handle_new_user trigger.';
