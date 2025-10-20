-- Manual migration application for workspace_settings RLS fix
-- This fixes the bug where Apollo API keys cannot be saved
-- Run this in the Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Workspace admins can manage settings" ON workspace_settings;

-- Recreate with proper USING and WITH CHECK clauses
CREATE POLICY "Workspace admins can manage settings"
  ON workspace_settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Verify the policy exists
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workspace_settings'
ORDER BY policyname;
