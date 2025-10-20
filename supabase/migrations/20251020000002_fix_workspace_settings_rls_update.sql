-- Fix workspace_settings RLS policy for UPDATE operations
-- Bug: "Workspace admins can manage settings" policy was missing WITH CHECK clause
-- This prevented UPDATE operations from working properly

-- Drop the problematic policy
DROP POLICY IF EXISTS "Workspace admins can manage settings" ON workspace_settings;

-- Recreate with proper USING and WITH CHECK clauses
-- USING: determines which rows can be selected for the operation
-- WITH CHECK: determines if the new row state is allowed
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
