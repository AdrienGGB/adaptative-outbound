# F030: CRM Native Integrations

## 📋 Overview

**Feature ID:** F030
**Priority:** P2 - Nice to Have
**Timeline:** Week 15-16 (Sprint 4)
**Dependencies:** F001 (Data Quality), F002 (Database), F004 (Auth), F005 (API Gateway)
**Status:** Planned (Not Started)

---

## 🎯 Goals

Build native CRM integrations that:

1. Connect to Salesforce via OAuth 2.0
2. Connect to HubSpot via OAuth 2.0
3. Sync accounts and contacts bidirectionally
4. Provide custom field mapping configuration
5. Handle conflicts with configurable resolution strategies
6. Maintain sync history and audit logs
7. Support real-time and scheduled sync

---

## 👥 User Stories

### Salesforce Integration

1. **As an admin**, I want to connect to Salesforce via OAuth so our data stays in sync
2. **As a user**, I want bidirectional sync so changes in either system are reflected
3. **As a sales ops**, I want field mapping controls so I can customize what syncs
4. **As a system**, I want to detect and resolve conflicts automatically
5. **As an admin**, I want to see sync logs so I can troubleshoot issues

### HubSpot Integration

1. **As an admin**, I want to connect to HubSpot via OAuth so we can sync contacts
2. **As a user**, I want to choose sync direction (push, pull, bidirectional)
3. **As a sales ops**, I want to filter which records sync based on criteria
4. **As a system**, I want to handle rate limits gracefully
5. **As an admin**, I want to monitor sync health and errors

### Configuration & Management

1. **As an admin**, I want to test the connection before enabling sync
2. **As a user**, I want to manually trigger sync when needed
3. **As a sales ops**, I want to pause sync without disconnecting
4. **As a system**, I want to retry failed sync operations automatically
5. **As a compliance officer**, I want audit logs of all sync operations

---

## ✅ Success Criteria

### Performance Requirements

- [ ]  CRM sync: 1,000 records in <5 minutes
- [ ]  OAuth flow completes in <30 seconds
- [ ]  Sync conflict detection: <500ms per record
- [ ]  Sync status updates in real-time (<2 seconds)

### Functional Requirements

- [ ]  Salesforce OAuth integration working
- [ ]  HubSpot OAuth integration working
- [ ]  Bidirectional sync operational for accounts and contacts
- [ ]  Field mapping configuration UI functional
- [ ]  Conflict resolution strategies implemented
- [ ]  Sync history and logs accessible
- [ ]  Manual and scheduled sync working
- [ ]  Sync pause/resume functionality

### Security Requirements

- [ ]  OAuth tokens encrypted at rest (AES-256)
- [ ]  Token refresh before expiration
- [ ]  Minimum necessary CRM permissions requested
- [ ]  Audit logging for all sync operations
- [ ]  Secure credential storage (Supabase Vault)

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- CRM Sync Configurations
CREATE TABLE crm_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- CRM Connection
  crm_provider VARCHAR(50) NOT NULL, -- 'salesforce', 'hubspot', 'pipedrive'
  is_active BOOLEAN DEFAULT TRUE,

  -- Credentials (encrypted via Supabase Vault)
  credentials_vault_id UUID, -- Reference to vault.secrets

  -- OAuth Info
  oauth_instance_url TEXT, -- Salesforce instance URL
  oauth_user_email TEXT, -- Connected as which user

  -- Sync Configuration
  sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'push', 'pull', 'bidirectional'
  sync_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'

  -- Entity Types to Sync
  sync_entities TEXT[] DEFAULT ARRAY['accounts', 'contacts'],

  -- Field Mappings
  field_mappings JSONB NOT NULL,
  -- {
  --   "accounts": {
  --     "Name": "name",
  --     "Website": "domain",
  --     "Industry": "industry"
  --   },
  --   "contacts": {
  --     "FirstName": "first_name",
  --     "LastName": "last_name",
  --     "Email": "email"
  --   }
  -- }

  -- Sync Rules (Filters)
  sync_rules JSONB,
  -- {
  --   "accounts": {
  --     "filter": "OwnerId == '{current_user_sfdc_id}'",
  --     "exclude_fields": ["custom_field_1"]
  --   }
  -- }

  -- Conflict Resolution
  conflict_resolution VARCHAR(50) DEFAULT 'last_write_wins',
  -- Options: 'last_write_wins', 'crm_wins', 'app_wins', 'manual_review'

  -- Status
  status VARCHAR(20) DEFAULT 'connected', -- 'connected', 'disconnected', 'error', 'paused'
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(20), -- 'success', 'failed', 'partial'
  last_sync_error TEXT,
  next_sync_at TIMESTAMP,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, crm_provider)
);

CREATE INDEX idx_crm_sync_configs_workspace ON crm_sync_configs(workspace_id);
CREATE INDEX idx_crm_sync_configs_next_sync ON crm_sync_configs(next_sync_at)
  WHERE is_active = TRUE AND status = 'connected';

-- RLS
ALTER TABLE crm_sync_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM configs"
  ON crm_sync_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_sync_configs.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- CRM Sync Logs
CREATE TABLE crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES crm_sync_configs(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Sync Details
  sync_direction VARCHAR(10), -- 'push', 'pull'
  entity_type VARCHAR(50), -- 'account', 'contact'

  -- Results
  records_processed INT DEFAULT 0,
  records_synced INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  conflicts_detected INT DEFAULT 0,
  conflicts_resolved INT DEFAULT 0,

  -- Performance
  sync_duration_ms INT,

  -- Status
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_crm_sync_logs_config ON crm_sync_logs(config_id, started_at DESC);
CREATE INDEX idx_crm_sync_logs_workspace ON crm_sync_logs(workspace_id, started_at DESC);
CREATE INDEX idx_crm_sync_logs_status ON crm_sync_logs(status)
  WHERE status IN ('running', 'failed');

-- RLS
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs in their workspace"
  ON crm_sync_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- CRM Field Mappings (for each entity)
CREATE TABLE crm_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES crm_sync_configs(id) ON DELETE CASCADE,

  entity_type VARCHAR(50) NOT NULL, -- 'account', 'contact', 'opportunity'

  -- Mapping
  crm_field VARCHAR(255) NOT NULL,
  app_field VARCHAR(255) NOT NULL,

  -- Direction
  sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'push', 'pull', 'bidirectional', 'none'

  -- Transformation
  transform_function TEXT, -- Optional JS function for field transformation

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(config_id, entity_type, crm_field)
);

CREATE INDEX idx_crm_field_mappings_config ON crm_field_mappings(config_id, entity_type);

-- CRM Sync Conflicts (for manual review)
CREATE TABLE crm_sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES crm_sync_configs(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Conflict Details
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID, -- Our app's record ID
  crm_record_id VARCHAR(255), -- CRM's record ID

  -- Conflicting Data
  app_data JSONB NOT NULL,
  crm_data JSONB NOT NULL,
  conflicting_fields TEXT[], -- ['name', 'email']

  -- Resolution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
  resolution_strategy VARCHAR(50), -- 'use_app', 'use_crm', 'manual'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP,

  -- Metadata
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crm_sync_conflicts_workspace ON crm_sync_conflicts(workspace_id, status);
CREATE INDEX idx_crm_sync_conflicts_config ON crm_sync_conflicts(config_id, detected_at DESC);

-- RLS
ALTER TABLE crm_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage conflicts in their workspace"
  ON crm_sync_conflicts FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## 🔌 API Endpoints

### CRM Connection

```
POST   /api/crm/connect
Body: { provider: 'salesforce' | 'hubspot', authCode }
Response: { config, redirectUrl? }

POST   /api/crm/oauth/callback
Body: { provider, code, state }
Response: { config, success: true }

DELETE /api/crm/disconnect/:provider
Response: { success: true }

POST   /api/crm/:provider/test-connection
Response: { connected: boolean, user: {...}, error? }
```

### CRM Configuration

```
GET    /api/crm/configs
Response: { configs: [] }

GET    /api/crm/configs/:id
Response: { config, fieldMappings, stats }

PATCH  /api/crm/configs/:id
Body: { syncDirection?, syncFrequency?, syncRules?, conflictResolution? }
Response: { config }

PATCH  /api/crm/configs/:id/pause
Response: { config }

PATCH  /api/crm/configs/:id/resume
Response: { config }
```

### Field Mappings

```
GET    /api/crm/configs/:id/field-mappings
Response: { mappings: [] }

POST   /api/crm/configs/:id/field-mappings
Body: { entityType, crmField, appField, syncDirection }
Response: { mapping }

PATCH  /api/crm/configs/:id/field-mappings/:mappingId
Body: { appField?, syncDirection?, transformFunction? }
Response: { mapping }

DELETE /api/crm/configs/:id/field-mappings/:mappingId
Response: { success: true }

GET    /api/crm/:provider/available-fields
Query: { entityType }
Response: { fields: [{ name, label, type, required }] }
```

### Sync Operations

```
POST   /api/crm/sync/trigger
Body: { configId, syncDirection?, entityTypes? }
Response: { job_id, estimatedRecords }

GET    /api/crm/sync/logs
Query: { configId?, limit?, offset? }
Response: { logs: [], pagination }

GET    /api/crm/sync/logs/:id
Response: { log, details: { errors: [...], conflicts: [...] } }

POST   /api/crm/sync/logs/:id/retry
Response: { job_id }
```

### Conflict Management

```
GET    /api/crm/conflicts
Query: { configId?, status?, entityType? }
Response: { conflicts: [] }

POST   /api/crm/conflicts/:id/resolve
Body: { strategy: 'use_app' | 'use_crm', mergedData? }
Response: { conflict }

POST   /api/crm/conflicts/:id/ignore
Response: { conflict }
```

---

## 🎨 UI/UX Screens

### 1. CRM Integration Settings

**Header:**
- "Connected CRMs" section
- "+ Connect CRM" button with dropdown (Salesforce, HubSpot)

**CRM Cards (when connected):**
- Provider logo and name
- Status badge: Connected (green) / Error (red) / Paused (yellow)
- Connected as: user@company.com
- Last synced: "2 hours ago"
- Next sync: "In 28 minutes"
- Quick stats: "1,234 accounts synced"
- Actions: Configure, Sync Now, Pause/Resume, Disconnect

**Empty State (no CRMs connected):**
- Illustration
- "Connect your CRM to keep data in sync"
- Button: "Connect Salesforce" / "Connect HubSpot"

---

### 2. Connect CRM Flow (OAuth)

**Step 1: Choose Provider**
- Large cards for Salesforce and HubSpot
- Each card shows: Logo, description, "Connect" button

**Step 2: OAuth Authorization**
- Redirect to Salesforce/HubSpot login
- User authorizes permissions
- Redirect back to app

**Step 3: Configure Sync**
- Sync direction: Dropdown (Bidirectional, Push Only, Pull Only)
- Sync frequency: Dropdown (Real-time, Hourly, Daily, Manual)
- Entity types: Checkboxes (Accounts, Contacts, Opportunities)
- Button: "Complete Setup"

**Step 4: Success**
- Success message: "Salesforce connected successfully"
- "Next steps: Configure field mappings"
- Button: "Configure Field Mappings" / "Done"

---

### 3. Field Mapping Configuration

**Header:**
- CRM provider name and logo
- "Field Mappings" title
- "Auto-Map Fields" button (smart matching)

**Entity Type Tabs:**
- Tabs: Accounts | Contacts | (Opportunities)

**Mapping Table:**
- Columns: CRM Field | App Field | Direction | Actions
- Example row:
  - CRM Field: "AccountName" (Salesforce)
  - App Field: Dropdown → "name"
  - Direction: Toggle (Bidirectional, Push, Pull, None)
  - Actions: Edit, Delete

**Add Custom Mapping:**
- Button: "+ Add Mapping"
- Modal:
  - CRM Field: Dropdown (with search)
  - App Field: Dropdown (with search)
  - Direction: Radio buttons
  - Advanced: Transform function (optional, JS code)

**Preview Section:**
- Shows sample data from CRM
- Shows how it will map to our fields
- Highlights any unmapped required fields

---

### 4. Sync History & Logs

**Filters:**
- Date range picker
- Status dropdown: All, Completed, Failed, Partial
- Entity type: All, Accounts, Contacts

**Sync Logs Table:**
- Columns: Timestamp, Direction, Entity, Records Synced, Conflicts, Status, Duration, Actions
- Example row:
  - Timestamp: Jan 18, 2025 14:30
  - Direction: Pull (down arrow icon)
  - Entity: Accounts
  - Records: 234 synced, 5 failed
  - Conflicts: 2 detected
  - Status: Partial (yellow badge)
  - Duration: 2m 34s
  - Actions: View Details, Retry (if failed)

**Sync Detail Modal:**
- Summary stats
- Success/Failed breakdown
- List of errors with record IDs
- List of conflicts
- Timeline of sync stages
- Button: "Retry Failed Records" (if applicable)

---

### 5. Conflict Resolution

**Conflicts List:**
- Table showing pending conflicts
- Columns: Record, Conflicting Fields, Detected, Actions
- Example row:
  - Record: "Acme Corp" (account)
  - Conflicting Fields: Name, Industry
  - Detected: 5 min ago
  - Actions: Review button

**Conflict Detail View:**
- Split comparison view
- Left: App data
- Right: CRM data
- Conflicting fields highlighted
- Per-field resolution:
  - Radio: Keep App Value / Keep CRM Value
  - Or: Manually edit merged value
- Actions:
  - Button: "Resolve with Selected Values"
  - Button: "Ignore Conflict"
  - Button: "Always Use App" (sets rule)
  - Button: "Always Use CRM" (sets rule)

---

### 6. Sync Settings

**Sync Frequency:**
- Radio buttons: Real-time, Hourly, Daily, Manual
- If Hourly/Daily: Time picker for when to run

**Sync Direction:**
- Radio buttons with illustrations:
  - Bidirectional (⟷): Changes sync both ways
  - Push Only (→): Changes go from App to CRM
  - Pull Only (←): Changes come from CRM to App

**Conflict Resolution:**
- Dropdown: Last Write Wins, CRM Always Wins, App Always Wins, Manual Review

**Sync Filters:**
- Add rule builder:
  - Field dropdown
  - Operator: equals, contains, greater than, etc.
  - Value input
  - Example: "Only sync accounts where Owner = Current User"

**Advanced Options:**
- Checkbox: "Create new records if not found"
- Checkbox: "Delete records when deleted in CRM"
- Checkbox: "Sync attachments and files"

---

## 🔐 Security

### OAuth 2.0 Security

1. **Authorization Code Flow**: Use OAuth 2.0 authorization code flow (not implicit)
2. **State Parameter**: Validate state parameter to prevent CSRF
3. **PKCE**: Use Proof Key for Code Exchange for added security
4. **Scope Limitation**: Request minimum necessary permissions
   - Salesforce: `api`, `refresh_token`, `offline_access`
   - HubSpot: `crm.objects.contacts.read`, `crm.objects.companies.read`, etc.

### Token Management

1. **Encryption at Rest**: Store OAuth tokens encrypted in Supabase Vault (AES-256)
2. **Token Rotation**: Refresh access tokens before expiration
3. **Secure Storage**: Never log or expose tokens in error messages
4. **Token Revocation**: Revoke tokens when disconnecting CRM

### API Security

1. **Rate Limiting**: Respect CRM rate limits
   - Salesforce: 15,000 API calls per 24 hours (default)
   - HubSpot: 100 requests per 10 seconds
2. **Error Handling**: Don't expose CRM errors directly to users
3. **Audit Logging**: Log all sync operations for compliance
4. **Data Validation**: Validate all data before syncing

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  OAuth flow (state validation, token exchange)
- [ ]  Field mapping logic
- [ ]  Conflict detection algorithm
- [ ]  Data transformation functions

### Integration Tests

- [ ]  End-to-end Salesforce OAuth flow
- [ ]  End-to-end HubSpot OAuth flow
- [ ]  Bidirectional sync (create, update, delete)
- [ ]  Conflict resolution scenarios
- [ ]  Error handling (invalid credentials, rate limits)

### Performance Tests

- [ ]  Sync 1,000 records in <5 minutes
- [ ]  Concurrent syncs (multiple workspaces)
- [ ]  Rate limit handling
- [ ]  Large dataset sync (10,000+ records)

### Security Tests

- [ ]  OAuth CSRF protection
- [ ]  Token encryption verification
- [ ]  Minimum permission scope enforcement
- [ ]  Audit log completeness

---

## 📦 Dependencies & Libraries

### Backend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "jsforce": "^2.0.0",
    "@hubspot/api-client": "^10.1.0",
    "axios": "^1.6.0"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: Salesforce Integration

**Days 1-2:**
- [ ]  Set up Salesforce connected app
- [ ]  Implement OAuth 2.0 flow
- [ ]  Store credentials securely in Vault
- [ ]  Test connection and basic API calls

**Days 3-4:**
- [ ]  Build sync engine for accounts and contacts
- [ ]  Implement field mapping configuration
- [ ]  Add conflict detection logic

**Day 5:**
- [ ]  Build field mapping UI
- [ ]  Test bidirectional sync
- [ ]  Handle edge cases and errors

### Week 2: HubSpot Integration & UI

**Days 1-2:**
- [ ]  Set up HubSpot app
- [ ]  Implement OAuth 2.0 flow
- [ ]  Build sync engine for companies and contacts

**Days 3-4:**
- [ ]  Build CRM connection UI
- [ ]  Create sync history dashboard
- [ ]  Implement conflict resolution UI

**Day 5:**
- [ ]  End-to-end testing
- [ ]  Performance optimization
- [ ]  Documentation

---

## 🎯 Definition of Done

- [ ]  Salesforce OAuth integration working
- [ ]  HubSpot OAuth integration working
- [ ]  Bidirectional sync operational
- [ ]  Field mapping UI functional
- [ ]  Conflict resolution working
- [ ]  Sync logs accessible
- [ ]  Manual and scheduled sync working
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Security audit passed
- [ ]  Documentation complete

---

## 🔮 Future Enhancements

1. **More CRM Integrations**: Pipedrive, Zoho, Copper, Microsoft Dynamics
2. **Advanced Field Transformations**: Visual formula builder for field mappings
3. **Sync Scheduling**: More granular scheduling options
4. **Webhook-Based Sync**: Real-time sync via CRM webhooks
5. **Sync Analytics**: Dashboard showing sync health and trends
6. **Bulk Operations**: Bulk update/create via CRM API
7. **Custom Object Sync**: Sync custom objects and fields
8. **Multi-Way Sync**: Sync with multiple CRMs simultaneously
9. **AI-Powered Mapping**: ML-based field mapping suggestions
10. **Rollback Capability**: Undo sync operations

---

## 📚 Resources

- [Salesforce OAuth 2.0](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm)
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [HubSpot OAuth](https://developers.hubspot.com/docs/api/working-with-oauth)
- [HubSpot API](https://developers.hubspot.com/docs/api/overview)
- [OAuth 2.0 Security](https://oauth.net/2/security-topics/)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

**Product Manager:** ___ **Date:** __
