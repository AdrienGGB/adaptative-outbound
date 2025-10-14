-- Add Foreign Key Relationship for PostgREST Auto-Join
--
-- PROBLEM: PostgREST cannot auto-detect the relationship between workspace_members
-- and profiles because there's no direct foreign key. The current schema has:
--   - workspace_members.user_id -> auth.users(id)
--   - profiles.id -> auth.users(id)
-- But no direct FK from workspace_members to profiles.
--
-- SOLUTION: Add explicit foreign key constraint so PostgREST can enable queries like:
--   .select('*, profiles(*)')
--
-- This fixes the 400 Bad Request error on the members page.
--
-- NOTE: Since profiles.id already references auth.users(id) and workspace_members.user_id
-- also references auth.users(id), adding this FK is safe and creates a direct path
-- for PostgREST to follow.

-- ============================================================================
-- Add Foreign Key Constraint
-- ============================================================================

-- First, let's verify the constraint doesn't already exist
-- (This migration is idempotent)
DO $$
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_workspace_members_profile'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE workspace_members
    ADD CONSTRAINT fk_workspace_members_profile
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

    RAISE NOTICE 'Added foreign key constraint fk_workspace_members_profile';
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_workspace_members_profile already exists';
  END IF;
END $$;

-- ============================================================================
-- Add Index for Performance (if not exists)
-- ============================================================================

-- The index on user_id should already exist from migration 001, but let's ensure it
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON workspace_members(user_id);

-- ============================================================================
-- Verification
-- ============================================================================

-- This should now work in PostgREST:
-- SELECT * FROM workspace_members?select=*,profiles(*)

COMMENT ON CONSTRAINT fk_workspace_members_profile ON workspace_members IS
'Foreign key to profiles table. Enables PostgREST auto-join for queries like select=*,profiles(*).
This fixes the 400 Bad Request error when fetching members with profile information.';
