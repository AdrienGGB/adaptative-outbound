# F004: User Authentication & Authorization System

## 📋 Overview

**Feature ID:** F004

**Priority:** P0 - Critical Foundation

**Timeline:** Week 1-2 (Sprint 1)

**Dependencies:** None (First feature to build)

**Status:** Ready for Development

---

## 🎯 Goals

Build a secure, scalable authentication and authorization system that:

1. Allows users to sign in via Single Sign-On (SSO)
2. Enforces role-based access control (RBAC)
3. Supports multi-tenant workspaces
4. Provides audit logging for compliance
5. Performs auth checks in <100ms

---

## 👥 User Stories

### Core Authentication

1. **As a new user**, I want to sign up with my Google/Microsoft account so I can start quickly without creating a password
2. **As a returning user**, I want to sign in seamlessly so I can access my workspace instantly
3. **As an enterprise user**, I want to use my company's SSO (Okta) so I follow corporate security policies
4. **As a user**, I want my session to persist for 30 days so I don't have to log in repeatedly
5. **As a security-conscious user**, I want to log out from all devices so I can secure my account

### Workspace Management

1. **As a sales leader**, I want to create a workspace for my team so we can collaborate on accounts
2. **As a workspace admin**, I want to invite team members so they can access our data
3. **As a user**, I want to switch between workspaces so I can manage multiple teams/clients
4. **As a workspace owner**, I want to remove users so I can manage who has access

### Role-Based Access

1. **As a workspace admin**, I want to assign roles (Admin, Sales Manager, SDR, AE) so I can control permissions
2. **As an SDR**, I want to only see accounts assigned to me so I'm not overwhelmed
3. **As a Sales Manager**, I want to see all team members' activities so I can coach effectively
4. **As an Admin**, I want full access to settings and integrations so I can configure the platform

### Security & Compliance

1. **As a compliance officer**, I want to see who accessed what data so I can audit for GDPR/SOC2
2. **As a developer**, I want API authentication via keys so I can build integrations

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  SSO working with Google OAuth 2.0
- [ ]  SSO working with Microsoft Azure AD
- [ ]  Okta SSO integration complete
- [ ]  RBAC enforced: 4 roles (Admin, Sales Manager, SDR, AE)
- [ ]  Multi-tenant data isolation verified (user in Workspace A cannot access Workspace B data)
- [ ]  Session management: 30-day JWT tokens with refresh
- [ ]  Logout from all devices functional
- [ ]  Workspace creation, invitation, and switching working
- [ ]  Role assignment and permission checks enforced
- [ ]  Audit log capturing: login, logout, role changes, workspace access

### Performance Requirements

- [ ]  Auth check latency: <100ms (p99)
- [ ]  SSO login flow: <3 seconds end-to-end
- [ ]  Session validation: <50ms
- [ ]  Concurrent users supported: 10,000+

### Security Requirements

- [ ]  Passwords hashed with bcrypt (cost factor 12) for non-SSO users
- [ ]  JWT tokens signed with RS256 (asymmetric keys)
- [ ]  Refresh tokens stored encrypted in database
- [ ]  HTTPS enforced for all auth endpoints
- [ ]  Rate limiting: 5 failed login attempts = 15-minute lockout
- [ ]  No sensitive data in JWT payload (only user_id, workspace_id, role)

---

## 🏗️ Technical Architecture

### Authentication Strategy

**Supabase Auth** handles all authentication flows:
- Built-in support for email/password, OAuth providers (Google, Microsoft, Azure)
- JWT token generation and validation
- Session management and refresh tokens
- Row Level Security (RLS) for data isolation

**Custom Tables** extend Supabase's `auth.users`:

### Database Schema

```sql
-- Supabase provides auth.users table automatically
-- We extend it with a profiles table

-- User Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deleted'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces Table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- unique URL identifier
  
  -- Owner
  owner_id UUID REFERENCES users(id),
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Billing
  plan VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  seats_limit INT DEFAULT 5,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

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

-- Workspace Members (Junction Table)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role-Based Access Control
  role VARCHAR(50) NOT NULL, -- 'admin', 'sales_manager', 'sdr', 'ae'
  
  -- Invitation Status
  status VARCHAR(20) DEFAULT 'active', -- 'invited', 'active', 'suspended'
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

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

CREATE POLICY "Admins can manage workspace members"
  ON workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- Note: Supabase handles refresh tokens automatically via auth.refresh_tokens
-- We only track active sessions for "logout all devices" functionality

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Device Info
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Session tracking
  refresh_token_id UUID, -- Reference to Supabase's refresh token
  last_used_at TIMESTAMP DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_workspace ON user_sessions(workspace_id);

-- RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- API Keys (for programmatic access)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- first 8 chars for display
  key_hash VARCHAR(255) UNIQUE NOT NULL, -- hashed full key
  
  -- Permissions (scoped access)
  scopes TEXT[] DEFAULT ARRAY['read'], -- 'read', 'write', 'admin'
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_used_at TIMESTAMP,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- RLS for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = api_keys.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, 
    -- 'user.login', 'user.logout', 'user.invited', 'role.changed',
    -- 'workspace.created', 'api_key.created', etc.
  
  event_data JSONB, -- flexible storage for event-specific data
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

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
```

### Supabase Configuration

**Enable Auth Providers in Supabase Dashboard:**

1. **Google OAuth**
   - Get credentials from Google Cloud Console
   - Add to Supabase Auth → Providers → Google
   - Set redirect URL: `https://[project-ref].supabase.co/auth/v1/callback`

2. **Microsoft Azure AD**
   - Register app in Azure Portal
   - Add to Supabase Auth → Providers → Azure
   - Configure tenant ID and client credentials

3. **Email/Password**
   - Enabled by default
   - Configure email templates
   - Set password requirements

### Role Permissions Matrix

| Permission | Admin | Sales Manager | SDR | AE |
| --- | --- | --- | --- | --- |
| **Workspace Settings** |  |  |  |  |
| Edit workspace settings | ✅ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ |
| Remove users | ✅ | ✅ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| **Integrations** |  |  |  |  |
| Connect CRM | ✅ | ❌ | ❌ | ❌ |
| Manage API keys | ✅ | ❌ | ❌ | ❌ |
| Configure enrichment | ✅ | ❌ | ❌ | ❌ |
| **Accounts & Contacts** |  |  |  |  |
| View all accounts | ✅ | ✅ | ❌ | ✅ |
| View assigned accounts | ✅ | ✅ | ✅ | ✅ |
| Create accounts | ✅ | ✅ | ✅ | ✅ |
| Edit any account | ✅ | ✅ | ❌ | ❌ |
| Delete accounts | ✅ | ✅ | ❌ | ❌ |
| **Sequences & Outbound** |  |  |  |  |
| Create sequences | ✅ | ✅ | ✅ | ✅ |
| Edit own sequences | ✅ | ✅ | ✅ | ✅ |
| Edit any sequences | ✅ | ✅ | ❌ | ❌ |
| Send emails | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |  |  |  |  |
| View team analytics | ✅ | ✅ | ❌ | ❌ |
| View own analytics | ✅ | ✅ | ✅ | ✅ |
| Export reports | ✅ | ✅ | ❌ | ✅ |

### JWT Token Structure

**Access Token (short-lived, 15 minutes):**

```json
{
  "sub": "user-uuid",
  "wid": "workspace-uuid",
  "role": "sdr",
  "email": "[john@company.com](mailto:john@company.com)",
  "iat": 1696435200,
  "exp": 1696436100,
  "type": "access"
}
```

**Refresh Token (long-lived, 30 days):**

```json
{
  "sub": "user-uuid",
  "wid": "workspace-uuid",
  "jti": "refresh-token-uuid",
  "iat": 1696435200,
  "exp": 1699027200,
  "type": "refresh"
}
```

---

## 🔌 API Endpoints

### Authentication (Supabase Client SDK)

**Use Supabase client methods directly (no custom auth endpoints needed):**

```typescript
// Sign up with email/password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { first_name: 'John', last_name: 'Doe' }
  }
})

// Sign in with email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})

// Sign in with Microsoft (Azure)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'azure',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})

// Sign out
await supabase.auth.signOut()

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Custom Endpoints (Next.js API Routes / Edge Functions)

### Workspace Management (Custom Edge Functions)

```
POST   /api/workspaces
Body: { name, slug }
Response: { workspace }

GET    /api/workspaces
Response: { workspaces: [] }

GET    /api/workspaces/:id
Response: { workspace, members, settings }

PATCH  /api/workspaces/:id
Body: { name, settings }
Response: { workspace }

DELETE /api/workspaces/:id
Response: { success: true }

POST   /api/workspaces/:id/switch
Body: { workspace_id }
Response: { workspace, role, permissions }
Note: Session context updated via database, no new tokens needed
```

### Team Management

```
POST   /api/workspaces/:id/members/invite
Body: { email, role }
Response: { invitation }

GET    /api/workspaces/:id/members
Response: { members: [] }

PATCH  /api/workspaces/:id/members/:userId
Body: { role: 'sales_manager' }
Response: { member }

DELETE /api/workspaces/:id/members/:userId
Response: { success: true }
```

### Session Management

```
GET    /api/sessions
Response: { sessions: [] }

DELETE /api/sessions/:id
Response: { success: true }

POST   /api/sessions/revoke-all
Response: { success: true, count: 3 }
```

### API Keys

```
POST   /api/api-keys
Body: { name, scopes: ['read', 'write'] }
Response: { apiKey: 'sk_live_xxx...', keyPrefix: 'sk_live_', id }

GET    /api/api-keys
Response: { apiKeys: [] } (without full keys, only prefixes)

DELETE /api/api-keys/:id
Response: { success: true }
```

### Audit Logs

```
GET    /api/audit-logs
Query: { page, limit, eventType, userId, startDate, endDate }
Response: { logs: [], pagination }
```

---

## 🎨 UI/UX Screens

### 1. Login Screen

- **Layout:** Centered card on branded background
- **Components:**
    - Logo and tagline
    - "Continue with Google" button (primary)
    - "Continue with Microsoft" button (secondary)
    - "Continue with Okta" button (enterprise)
    - Divider: "Or sign in with email"
    - Email input
    - Password input
    - "Sign In" button
    - "Forgot password?" link
    - "Don't have an account? Sign up" link

### 2. Sign Up Screen

- Similar to login, but:
    - First Name & Last Name inputs
    - "Create Account" CTA
    - Terms & Privacy policy checkboxes

### 3. OAuth Consent Flow

- Redirect to provider (Google/Microsoft/Okta)
- Loading screen during callback processing
- Auto-redirect to app on success
- Error message if OAuth fails

### 4. Workspace Switcher

- **Trigger:** Click avatar in top-right
- **Dropdown showing:**
    - Current workspace (checkmark)
    - List of other workspaces
    - "Create New Workspace" button
    - "Workspace Settings" link (admin only)
    - Divider
    - "Profile Settings"
    - "Logout"

### 5. Workspace Settings (Admin Only)

- **Tabs:**
    - General (name, slug)
    - Team Members (invite, roles, remove)
    - API Keys (create, revoke)
    - Audit Logs (read-only table)
    - Billing (plan, seats)

### 6. Team Members Table

- **Columns:** Avatar, Name, Email, Role, Status, Joined Date, Actions
- **Actions:** Change Role (dropdown), Remove (confirm modal)
- **Invite Button:** Opens modal with email input and role selector

### 7. Session Management

- **Profile Settings → Active Sessions**
- **Table:** Device Name, Location (IP), Last Active, Browser
- **Actions:** "Revoke" button per session, "Logout All Devices" button

---

## 🔐 Security Considerations

### Authentication Security

1. **Password Policy (for email/password users):**
    - Minimum 8 characters
    - Must include: uppercase, lowercase, number, special char
    - Cannot be common passwords (use zxcvbn library)
    - Hashed with bcrypt (cost factor 12)
2. **SSO Security:**
    - State parameter prevents CSRF attacks
    - Verify OAuth state on callback
    - Validate ID token signature (RS256)
    - Check token expiration and issuer
3. **JWT Security:**
    - Sign with RS256 (private key on server only)
    - Store public key for verification
    - Short access token lifetime (15 min)
    - Refresh tokens stored hashed in DB
    - Include `jti` (JWT ID) to enable revocation
4. **Rate Limiting:**
    - 5 failed login attempts → 15-minute lockout
    - 10 API requests per second per user
    - Implement exponential backoff

### Authorization Security

1. **Multi-Tenancy Isolation:**
    - Every query must filter by `workspace_id`
    - Middleware enforces workspace context
    - Prevent cross-workspace data leakage
    - Test: User from Workspace A should get 403 when accessing Workspace B data
2. **Role Enforcement:**
    - Middleware checks user role before controller execution
    - Use permission matrix (see above)
    - Centralized permission check function
    - Example: `@RequireRole(['admin', 'sales_manager'])` decorator
3. **API Key Security:**
    - Prefix: `sk_live_` or `sk_test_`
    - Generate with crypto random (32 bytes)
    - Store only hash in database
    - Rate limit: 100 requests per minute per key
    - Scope-based permissions

### Audit & Compliance

1. **Audit Logging:**
    - Log all authentication events
    - Log all permission-sensitive actions
    - Include IP address and user agent
    - Immutable logs (append-only)
    - Retention: 1 year for compliance
2. **GDPR Compliance:**
    - User can export their data
    - User can delete their account
    - Data deletion cascades correctly
    - Anonymize audit logs on user deletion

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  Password hashing and verification
- [ ]  JWT token generation and validation
- [ ]  Role permission checks
- [ ]  OAuth state generation and verification
- [ ]  API key generation and hashing

### Integration Tests

- [ ]  User signup flow (email/password)
- [ ]  User login flow (email/password)
- [ ]  Google OAuth flow (mock OAuth provider)
- [ ]  Microsoft OAuth flow (mock)
- [ ]  Refresh token rotation
- [ ]  Logout and token revocation
- [ ]  Workspace creation and switching
- [ ]  Team member invitation flow
- [ ]  Role assignment and permission enforcement

### Security Tests

- [ ]  Multi-tenant isolation (user A cannot access workspace B)
- [ ]  RBAC enforcement (SDR cannot access admin endpoints)
- [ ]  SQL injection prevention
- [ ]  XSS prevention in user inputs
- [ ]  CSRF protection on state-changing endpoints
- [ ]  Rate limiting triggers after threshold
- [ ]  Expired tokens rejected
- [ ]  Revoked tokens rejected

### Performance Tests

- [ ]  Auth check latency <100ms (p99)
- [ ]  10,000 concurrent users supported
- [ ]  Token validation <50ms
- [ ]  Database query optimization (EXPLAIN ANALYZE)

### Manual Testing Checklist

- [ ]  Sign up with email/password
- [ ]  Sign in with Google
- [ ]  Sign in with Microsoft
- [ ]  Sign in with Okta (if configured)
- [ ]  Create workspace
- [ ]  Invite team member
- [ ]  Switch workspace
- [ ]  Change user role
- [ ]  Remove team member
- [ ]  Create API key
- [ ]  Revoke API key
- [ ]  Logout from single device
- [ ]  Logout from all devices
- [ ]  View audit logs

---

## 📦 Dependencies & Libraries

### Web App (Next.js)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zustand": "^4.4.1"
  }
}
```

### Mobile App (React Native + Expo)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.1"
  }
}
```

### Shared

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "typescript": "^5.3.0"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: Core Authentication

**Days 1-2: Supabase Setup & Database Schema**

- [ ]  Configure Supabase project
- [ ]  Enable email/password auth in Supabase dashboard
- [ ]  Create database migrations (profiles, workspaces, workspace_members)
- [ ]  Configure RLS policies
- [ ]  Set up Supabase client in web-app and mobile-app

**Days 3-4: Web App Auth UI**

- [ ]  Create Supabase client utilities (src/lib/supabase/)
- [ ]  Build login page with shadcn/ui components
- [ ]  Build signup page with form validation (Zod)
- [ ]  Implement auth callback route handler
- [ ]  Set up auth state management (Zustand + Supabase session)
- [ ]  Add protected route middleware

**Day 5: Mobile App Auth UI**

- [ ]  Create Supabase client setup (src/lib/supabase.ts)
- [ ]  Build LoginScreen with React Native components
- [ ]  Build SignupScreen with validation
- [ ]  Implement auth state persistence (AsyncStorage)
- [ ]  Create AuthNavigator and AppNavigator
- [ ]  Add session handling

### Week 2: SSO & RBAC

**Days 1-2: OAuth Providers**

- [ ]  Configure Google OAuth in Supabase dashboard
- [ ]  Configure Microsoft Azure AD in Supabase dashboard
- [ ]  Add OAuth buttons to login screens (web + mobile)
- [ ]  Test OAuth flows end-to-end
- [ ]  Handle OAuth callbacks and profile creation

**Day 3: Workspace Management**

- [ ]  Create workspace creation API (Next.js API route / Edge Function)
- [ ]  Build workspace creation UI (web + mobile)
- [ ]  Implement workspace switching
- [ ]  Build workspace switcher dropdown (web)
- [ ]  Build workspace switcher screen (mobile)

**Day 4: RBAC & Team Management**

- [ ]  Create team invitation endpoints
- [ ]  Build team members table UI (web)
- [ ]  Build team members screen (mobile)
- [ ]  Implement role assignment
- [ ]  Add RLS helper functions for permission checks
- [ ]  Test multi-tenant data isolation

**Day 5: Session Management & Audit**

- [ ]  Implement session tracking (user_sessions table)
- [ ]  Build active sessions viewer (web + mobile)
- [ ]  Add "logout all devices" functionality
- [ ]  Implement audit logging (database trigger or Edge Function)
- [ ]  Build audit log viewer (admin only, web)
- [ ]  Security testing and polish

---

## 🎯 Definition of Done

- [ ]  All API endpoints functional and documented
- [ ]  All UI screens built and tested
- [ ]  All success criteria met
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Security tests passing
- [ ]  Performance benchmarks met (<100ms auth check)
- [ ]  Code reviewed and approved
- [ ]  Documentation complete (API docs, README)
- [ ]  Deployed to staging environment
- [ ]  QA testing complete
- [ ]  Product manager sign-off

---

## 🔮 Future Enhancements (Post-MVP)

1. **Magic Link Login** (passwordless via email)
2. **Two-Factor Authentication (2FA)** (TOTP via app)
3. **SAML SSO** for enterprise customers
4. **Session Recording** for security monitoring
5. **IP Whitelisting** for enterprise workspaces
6. **Custom Roles** (beyond 4 default roles)
7. **Fine-Grained Permissions** (per-feature toggles)
8. **Account Linking** (merge Google + Microsoft accounts)
9. **Biometric Auth** (fingerprint, Face ID on mobile)
10. **Security Keys** (WebAuthn/FIDO2 support)

---

## 📚 Resources

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Okta Developer Docs](https://developer.okta.com/docs/)

---

## ✅ Sign-Off

**Developer:**  ***Date:*** __

**QA Engineer:**  ***Date:*** __

**Product Manager:**  ***Date:*** __