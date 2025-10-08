-- Fix F002 RLS Policies to Use SECURITY DEFINER Function
-- This migration fixes infinite recursion by using get_user_workspace_memberships()

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view accounts in their workspace" ON accounts;
DROP POLICY IF EXISTS "Users can create accounts in their workspace" ON accounts;
DROP POLICY IF EXISTS "Users can update accounts in their workspace" ON accounts;
DROP POLICY IF EXISTS "Admins can delete accounts" ON accounts;

CREATE POLICY "Users can view accounts in their workspace"
  ON accounts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can create accounts in their workspace"
  ON accounts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can update accounts in their workspace"
  ON accounts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Admins can delete accounts"
  ON accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = accounts.workspace_id
      AND wm.role IN ('admin', 'sales_manager')
    )
  );

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view contacts in their workspace" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their workspace" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their workspace" ON contacts;
DROP POLICY IF EXISTS "Admins can delete contacts" ON contacts;

CREATE POLICY "Users can view contacts in their workspace"
  ON contacts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can create contacts in their workspace"
  ON contacts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can update contacts in their workspace"
  ON contacts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Admins can delete contacts"
  ON contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = contacts.workspace_id
      AND wm.role IN ('admin', 'sales_manager')
    )
  );

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view activities in their workspace" ON activities;
DROP POLICY IF EXISTS "Users can create activities in their workspace" ON activities;

CREATE POLICY "Users can view activities in their workspace"
  ON activities FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can create activities in their workspace"
  ON activities FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tasks in their workspace" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their workspace" ON tasks;
DROP POLICY IF EXISTS "Users can manage their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks in workspace" ON tasks;

CREATE POLICY "Users can view tasks in their workspace"
  ON tasks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can create tasks in their workspace"
  ON tasks FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can manage their assigned tasks"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage all tasks in workspace"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = tasks.workspace_id
      AND wm.role IN ('admin', 'sales_manager')
    )
  );

-- ============================================================================
-- TAGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tags in their workspace" ON tags;
DROP POLICY IF EXISTS "Users can manage tags in their workspace" ON tags;

CREATE POLICY "Users can view tags in their workspace"
  ON tags FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can manage tags in their workspace"
  ON tags FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

-- ============================================================================
-- ENTITY_TAGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view entity tags in their workspace" ON entity_tags;
DROP POLICY IF EXISTS "Users can manage entity tags in their workspace" ON entity_tags;

CREATE POLICY "Users can view entity tags in their workspace"
  ON entity_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = entity_tags.tag_id
      AND t.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage entity tags in their workspace"
  ON entity_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = entity_tags.tag_id
      AND t.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

-- ============================================================================
-- CUSTOM_FIELDS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view custom fields in their workspace" ON custom_fields;
DROP POLICY IF EXISTS "Admins can manage custom fields" ON custom_fields;

CREATE POLICY "Users can view custom fields in their workspace"
  ON custom_fields FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Admins can manage custom fields"
  ON custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = custom_fields.workspace_id
      AND wm.role = 'admin'
    )
  );

-- ============================================================================
-- CUSTOM_FIELD_VALUES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view custom field values for accessible entities" ON custom_field_values;
DROP POLICY IF EXISTS "Users can manage custom field values in their workspace" ON custom_field_values;

CREATE POLICY "Users can view custom field values for accessible entities"
  ON custom_field_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      WHERE cf.id = custom_field_values.custom_field_id
      AND cf.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage custom field values in their workspace"
  ON custom_field_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      WHERE cf.id = custom_field_values.custom_field_id
      AND cf.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view teams in their workspace" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

CREATE POLICY "Users can view teams in their workspace"
  ON teams FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = teams.workspace_id
      AND wm.role = 'admin'
    )
  );

-- ============================================================================
-- ALL OTHER F002 TABLES
-- ============================================================================

-- ACCOUNT_HIERARCHIES
DROP POLICY IF EXISTS "Users can view hierarchies in their workspace" ON account_hierarchies;
DROP POLICY IF EXISTS "Users can manage hierarchies in their workspace" ON account_hierarchies;

CREATE POLICY "Users can view hierarchies in their workspace"
  ON account_hierarchies FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Users can manage hierarchies in their workspace"
  ON account_hierarchies FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

-- ACCOUNT_VERSIONS
DROP POLICY IF EXISTS "Users can view account versions in their workspace" ON account_versions;

CREATE POLICY "Users can view account versions in their workspace"
  ON account_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_versions.account_id
      AND a.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

-- CONTACT_VERSIONS
DROP POLICY IF EXISTS "Users can view contact versions in their workspace" ON contact_versions;

CREATE POLICY "Users can view contact versions in their workspace"
  ON contact_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_versions.contact_id
      AND c.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

-- DEAD_LETTER_QUEUE
DROP POLICY IF EXISTS "Users can view DLQ in their workspace" ON dead_letter_queue;
DROP POLICY IF EXISTS "Admins can manage DLQ entries" ON dead_letter_queue;

CREATE POLICY "Users can view DLQ in their workspace"
  ON dead_letter_queue FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM get_user_workspace_memberships(auth.uid())
    )
  );

CREATE POLICY "Admins can manage DLQ entries"
  ON dead_letter_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM get_user_workspace_memberships(auth.uid()) wm
      WHERE wm.workspace_id = dead_letter_queue.workspace_id
      AND wm.role IN ('admin', 'sales_manager')
    )
  );

-- IMPORT_ACCOUNT_MAPPING
DROP POLICY IF EXISTS "Users can view import mappings in their workspace" ON import_account_mapping;

CREATE POLICY "Users can view import mappings in their workspace"
  ON import_account_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = import_account_mapping.account_id
      AND a.workspace_id IN (
        SELECT workspace_id
        FROM get_user_workspace_memberships(auth.uid())
      )
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
