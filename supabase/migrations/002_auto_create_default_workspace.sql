-- F004: Auto-create Default Workspace on Signup
-- Migration: 002_auto_create_default_workspace
-- Description: Automatically creates a default workspace when a user signs up

-- ============================================================================
-- FUNCTION: Create default workspace for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_workspace_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_workspace_id UUID;
  workspace_slug TEXT;
  workspace_name TEXT;
BEGIN
  -- Generate workspace name from email (everything before @)
  workspace_name := split_part(NEW.email, '@', 1) || '''s Workspace';

  -- Generate slug from email (everything before @)
  workspace_slug := LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'))
    || '-workspace-'
    || SUBSTRING(NEW.id::text FROM 1 FOR 8);

  -- Create workspace using the helper function
  -- This function handles workspace creation, adding the user as admin, and audit logging
  default_workspace_id := public.create_workspace_with_owner(
    workspace_name,
    workspace_slug,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-create workspace on user signup
-- ============================================================================

CREATE TRIGGER on_auth_user_create_default_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_workspace_for_user();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
