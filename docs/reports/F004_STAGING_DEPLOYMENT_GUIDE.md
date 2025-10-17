# F004 STAGING DEPLOYMENT GUIDE

**Feature**: F004 - User Authentication & Authorization System
**Environment**: Staging (Supabase Cloud + Vercel Preview)
**Date**: 2025-10-05
**Status**: Ready for deployment

---

## Quick Start

**Estimated Time**: 35-45 minutes

**Prerequisites**:
- Access to Supabase Dashboard (hymtbydkynmkyesoaucl)
- Access to Vercel Dashboard
- Git push access to GitHub repository

**Steps Overview**:
1. Apply 2 SQL migrations to Supabase ⏱️ 10 min
2. Configure Vercel environment variables ⏱️ 5 min
3. Deploy to Vercel ⏱️ 5 min
4. Test complete authentication flow ⏱️ 15 min

---

## PART 1: APPLY MIGRATIONS TO STAGING SUPABASE

### Step 1.1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. Log in if needed
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"** button (top right)

### Step 1.2: Apply Main Migration (001_auth_and_workspaces.sql)

**Copy and paste this SQL into the editor:**

```sql
-- F004: User Authentication & Authorization System
-- Migration: 001_auth_and_workspaces
-- Description: Core authentication tables, workspaces, RBAC, and audit logging

-- ============================================================================
-- PROFILES TABLE (Extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Owner
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,

  -- Billing
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  seats_limit INT DEFAULT 5,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- ============================================================================
-- WORKSPACE MEMBERS (Junction Table)
-- ============================================================================

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Role-Based Access Control
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sdr', 'ae')),

  -- Invitation Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);

-- ============================================================================
-- WORKSPACE INVITATIONS
-- ============================================================================

CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sdr', 'ae')),
  token VARCHAR(255) UNIQUE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),

  -- Metadata
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  accepted_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(workspace_id, email, status)
);

CREATE INDEX idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);

-- ============================================================================
-- USER SESSIONS (For "Logout All Devices" functionality)
-- ============================================================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Device Info
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Session tracking
  refresh_token_id UUID,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_workspace ON user_sessions(workspace_id);

-- ============================================================================
-- API KEYS (For programmatic access)
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,

  -- Permissions (scoped access)
  scopes TEXT[] DEFAULT ARRAY['read'],

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- SYSTEM CONTROLS (Essential v1 - feature flags)
-- ============================================================================

CREATE TABLE system_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their workspace"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS for workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

CREATE POLICY "Admins can update workspace members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete workspace members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- RLS for workspace_invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view workspace invitations"
  ON workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_invitations.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can create workspace invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_invitations.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view workspace API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = api_keys.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = api_keys.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can update API keys"
  ON api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = api_keys.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view workspace audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = audit_logs.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS for system_controls
ALTER TABLE system_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view system controls"
  ON system_controls FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update system controls"
  ON system_controls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create workspace and auto-add owner as admin
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  workspace_name TEXT,
  workspace_slug TEXT,
  owner_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (workspace_name, workspace_slug, owner_user_id)
  RETURNING id INTO new_workspace_id;

  -- Add owner as admin member
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (new_workspace_id, owner_user_id, 'admin', 'active', NOW());

  -- Log audit event
  INSERT INTO audit_logs (workspace_id, user_id, event_type, event_data)
  VALUES (
    new_workspace_id,
    owner_user_id,
    'workspace.created',
    jsonb_build_object('workspace_name', workspace_name, 'workspace_slug', workspace_slug)
  );

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's workspace role
CREATE OR REPLACE FUNCTION get_user_workspace_role(
  p_user_id UUID,
  p_workspace_id UUID
)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM workspace_members
  WHERE user_id = p_user_id
  AND workspace_id = p_workspace_id
  AND status = 'active';

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_workspace_id UUID,
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['admin', 'sales_manager', 'ae', 'sdr'];
  user_role_level INT;
  required_role_level INT;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM workspace_members
  WHERE user_id = p_user_id
  AND workspace_id = p_workspace_id
  AND status = 'active';

  -- If user not found, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Get role levels (lower number = higher permission)
  SELECT array_position(role_hierarchy, user_role) INTO user_role_level;
  SELECT array_position(role_hierarchy, p_required_role) INTO required_role_level;

  -- Check if user's role level is equal or higher (lower number)
  RETURN user_role_level <= required_role_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE DEFAULT WORKSPACE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  user_first_name TEXT;
  workspace_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- Get user's first name from metadata
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'My');

  -- Create workspace name
  workspace_name := user_first_name || '''s Workspace';

  -- Create unique slug
  workspace_slug := lower(user_first_name) || '-workspace-' || substr(md5(random()::text), 1, 8);

  -- Create workspace and add user as admin
  new_workspace_id := create_workspace_with_owner(
    workspace_name,
    workspace_slug,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_create_default_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_workspace_for_user();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default system controls
INSERT INTO system_controls (feature, enabled, description) VALUES
  ('user_signup', true, 'Allow new user signups'),
  ('oauth_google', true, 'Google OAuth login'),
  ('oauth_microsoft', false, 'Microsoft OAuth login'),
  ('oauth_azure', false, 'Azure AD login'),
  ('workspace_creation', true, 'Allow workspace creation'),
  ('api_keys', true, 'Allow API key generation');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

**Click "Run" (or Cmd+Enter)**

**Expected Output:** `Success. No rows returned`

### Step 1.3: Apply RLS Fix Migration

**Copy and paste this SQL into a new query:**

```sql
-- Create function to get user workspace memberships
-- This function bypasses RLS policies to avoid circular dependencies

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

GRANT EXECUTE ON FUNCTION get_user_workspace_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_workspace_memberships(UUID) TO anon;
```

**Click "Run"**

### Step 1.4: Verify Tables

Go to **Table Editor** - should see 8 tables:
- profiles
- workspaces
- workspace_members
- workspace_invitations
- user_sessions
- api_keys
- audit_logs
- system_controls

---

## PART 2: CONFIGURE VERCEL

### Step 2.1: Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**

Add these for **Preview** environment:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hymtbydkynmkyesoaucl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bXRieWRreW5ta3llc29hdWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTc0NjksImV4cCI6MjA3NTA3MzQ2OX0.4vS3hNZ_e49k050AsIk8cdFAQfidMXUHiTIA_hz41tM` |

### Step 2.2: Deploy

Push to trigger deployment:

```bash
git checkout dev
git commit --allow-empty -m "deploy: trigger F004 staging deployment"
git push origin dev
```

Get deployment URL from Vercel dashboard.

---

## PART 3: TESTING

### Test Checklist

1. **Signup**: Create test user at `/signup`
2. **Verify**: Check Supabase Dashboard → Users
3. **Login**: Login at `/login`
4. **Workspace**: Verify workspace page loads
5. **Create**: Create new workspace
6. **Switch**: Switch between workspaces

### Expected Results

- ✅ User created in Supabase
- ✅ Profile auto-created
- ✅ Default workspace created
- ✅ User is admin
- ✅ Can create workspaces
- ✅ Can switch workspaces
- ✅ No console errors

---

## Troubleshooting

**Migration fails**: Tables may exist. Drop and re-run:
```sql
DROP TABLE IF EXISTS audit_logs, api_keys, user_sessions,
  workspace_invitations, workspace_members, workspaces, profiles, system_controls CASCADE;
```

**Signup doesn't create workspace**: Check triggers in SQL Editor

**Can't connect from Vercel**: Verify environment variables

---

## Success Checklist

- [ ] Both migrations applied to Supabase
- [ ] All 8 tables created
- [ ] Vercel environment variables configured
- [ ] Deployment successful
- [ ] User signup works
- [ ] Workspace auto-created
- [ ] Login works
- [ ] No errors

---

**Next**: After staging verified → Deploy to production
