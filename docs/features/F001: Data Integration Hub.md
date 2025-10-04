# F001: Data Integration Hub

## 📋 Overview

**Feature ID:** F001
**Priority:** P0 - Critical Foundation
**Timeline:** Week 3-4 (Sprint 1)
**Dependencies:** F002 (Database), F004 (Auth), F044 (Data Pipeline)
**Status:** Ready for Development

---

## 🎯 Goals

Build a comprehensive data integration system that:

1. Imports accounts from CSV files (10K rows in <2 minutes)
2. Syncs bidirectionally with CRMs (Salesforce, HubSpot)
3. Enriches data automatically with third-party providers (Clearbit, ZoomInfo)
4. Detects and handles duplicates with 90%+ accuracy
5. Maintains data quality and audit trail
6. Provides mapping and transformation tools

---

## 👥 User Stories

### CSV Import

1. **As a sales ops admin**, I want to import 10,000 accounts from CSV so I can quickly populate our TAM
2. **As a user**, I want to map CSV columns to account fields so imports match our data model
3. **As a user**, I want to preview import results so I can catch errors before committing
4. **As a system**, I want to detect duplicates during import so we don't create redundant records

### CRM Integration

1. **As an admin**, I want to sync with Salesforce so our data stays in sync
2. **As a user**, I want bidirectional sync so changes in either system are reflected
3. **As a sales ops**, I want field mapping controls so I can customize what syncs
4. **As a system**, I want to detect and resolve conflicts automatically

### Data Enrichment

1. **As an SDR**, I want accounts auto-enriched with firmographics so I have context
2. **As a user**, I want email verification so I know which contacts are valid
3. **As an admin**, I want to control enrichment spend so we stay within budget
4. **As a system**, I want to cache enrichment results so we don't pay twice

### Data Quality

1. **As a user**, I want duplicate detection on account creation so we maintain clean data
2. **As an admin**, I want to review and merge duplicates so we consolidate records
3. **As a system**, I want to validate data on import so bad records are flagged
4. **As a compliance officer**, I want import audit logs so I can trace data lineage

---

## ✅ Success Criteria

### Performance Requirements

- [ ]  CSV import: 10,000 rows in <2 minutes
- [ ]  CRM sync: 1,000 records in <5 minutes
- [ ]  Enrichment: <3 seconds per account
- [ ]  Duplicate detection: <1 second per record
- [ ]  Import validation: <500ms per row

### Functional Requirements

- [ ]  CSV import with field mapping working
- [ ]  Salesforce sync bidirectional and operational
- [ ]  HubSpot sync bidirectional and operational
- [ ]  Clearbit enrichment integrated and working
- [ ]  Duplicate detection 90%+ accuracy
- [ ]  Conflict resolution strategies implemented
- [ ]  Import preview and validation functional
- [ ]  Bulk update/merge operations working

### Data Quality Requirements

- [ ]  Email validation using regex + DNS check
- [ ]  Domain normalization (www.example.com → example.com)
- [ ]  Data deduplication before insert
- [ ]  Import error reporting comprehensive
- [ ]  Audit trail for all data changes

---

## 🏗️ Technical Architecture

### Database Schema Extensions

```sql
-- Import Jobs (extends jobs table from F044)
-- Stores import-specific metadata

-- Enrichment Cache
CREATE TABLE enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Cache Key
  provider VARCHAR(50) NOT NULL, -- 'clearbit', 'zoominfo', 'apollo'
  lookup_type VARCHAR(50) NOT NULL, -- 'domain', 'email', 'company_name'
  lookup_value VARCHAR(255) NOT NULL,

  -- Cached Data
  enrichment_data JSONB NOT NULL,
  data_version INT DEFAULT 1,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Cache expiration
  hit_count INT DEFAULT 0, -- Track cache hits
  last_accessed_at TIMESTAMP,

  UNIQUE(provider, lookup_type, lookup_value)
);

CREATE INDEX idx_enrichment_cache_workspace ON enrichment_cache(workspace_id);
CREATE INDEX idx_enrichment_cache_lookup ON enrichment_cache(provider, lookup_type, lookup_value);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access cache in their workspace"
  ON enrichment_cache FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- CRM Sync Mappings
CREATE TABLE crm_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- CRM Connection
  crm_provider VARCHAR(50) NOT NULL, -- 'salesforce', 'hubspot', 'pipedrive'
  is_active BOOLEAN DEFAULT TRUE,

  -- Credentials (encrypted)
  credentials JSONB NOT NULL, -- Store encrypted OAuth tokens, API keys

  -- Sync Configuration
  sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'push', 'pull', 'bidirectional'
  sync_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'

  -- Field Mappings
  field_mappings JSONB NOT NULL,
  -- {
  --   "accounts": {
  --     "Name": "name",
  --     "Website": "domain",
  --     "Industry": "industry"
  --   },
  --   "contacts": {...}
  -- }

  -- Sync Rules
  sync_rules JSONB,
  -- {
  --   "only_sync_if": "OwnerId == current_user",
  --   "exclude_fields": ["custom_field_1"]
  -- }

  -- Conflict Resolution
  conflict_resolution VARCHAR(50) DEFAULT 'last_write_wins',
  -- Options: 'last_write_wins', 'crm_wins', 'app_wins', 'manual_review'

  -- Status
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
  WHERE is_active = TRUE;

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

  sync_direction VARCHAR(10), -- 'push', 'pull'
  entity_type VARCHAR(50), -- 'account', 'contact', 'opportunity'

  records_synced INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  conflicts_detected INT DEFAULT 0,

  sync_duration_ms INT,
  error_details JSONB,

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_crm_sync_logs_config ON crm_sync_logs(config_id, started_at DESC);

-- Duplicate Candidates
CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  entity_type VARCHAR(50) NOT NULL, -- 'account', 'contact'
  entity_id_1 UUID NOT NULL,
  entity_id_2 UUID NOT NULL,

  -- Similarity Metrics
  similarity_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  matching_fields TEXT[], -- ['domain', 'name', 'email']

  -- Detection Method
  detection_method VARCHAR(50), -- 'domain_match', 'fuzzy_name', 'email_match'
  detected_at TIMESTAMP DEFAULT NOW(),

  -- Resolution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'merged', 'not_duplicate', 'ignored'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP,
  merged_into UUID, -- Which record was kept

  CHECK(entity_id_1 < entity_id_2), -- Prevent duplicate pairs
  UNIQUE(workspace_id, entity_type, entity_id_1, entity_id_2)
);

CREATE INDEX idx_duplicate_candidates_workspace ON duplicate_candidates(workspace_id, status);
CREATE INDEX idx_duplicate_candidates_score ON duplicate_candidates(similarity_score DESC)
  WHERE status = 'pending';

-- RLS
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view duplicates in their workspace"
  ON duplicate_candidates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can resolve duplicates in their workspace"
  ON duplicate_candidates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## 🔌 API Endpoints

### CSV Import

```
POST   /api/imports/csv
Body: FormData with file, mapping, options
Response: { job_id, preview }

POST   /api/imports/csv/preview
Body: FormData with file, mapping
Response: { preview: [...], errors: [...], stats: {...} }

GET    /api/imports/:job_id/status
Response: { status, progress, errors }
```

### CRM Integration

```
POST   /api/crm/connect
Body: { provider: 'salesforce', authCode }
Response: { config }

GET    /api/crm/configs
Response: { configs: [] }

PATCH  /api/crm/configs/:id
Body: { fieldMappings, syncRules, conflictResolution }
Response: { config }

POST   /api/crm/sync/trigger
Body: { configId, syncDirection?, entityTypes? }
Response: { job_id }

GET    /api/crm/sync/logs
Query: { configId?, limit? }
Response: { logs: [] }

DELETE /api/crm/configs/:id
Response: { success: true }
```

### Data Enrichment

```
POST   /api/enrichment/enrich
Body: { accountId, provider: 'clearbit', fields: [...] }
Response: { job_id }

POST   /api/enrichment/bulk
Body: { accountIds: [...], provider, fields }
Response: { job_id }

GET    /api/enrichment/providers
Response: { providers: [{ name, fields, cost }] }

GET    /api/enrichment/credits
Response: { remaining, limit, resetDate }
```

### Duplicate Management

```
GET    /api/duplicates
Query: { entityType?, status?, minScore? }
Response: { duplicates: [] }

POST   /api/duplicates/:id/merge
Body: { keepId, mergeId, strategy }
Response: { mergedRecord }

PATCH  /api/duplicates/:id/resolve
Body: { status: 'not_duplicate' }
Response: { duplicate }

POST   /api/duplicates/detect
Body: { entityType, entityId? }
Response: { job_id }
```

---

## 🎨 UI/UX Screens

### 1. CSV Import Wizard

**Step 1: Upload File**
- Drag-and-drop CSV file area
- File validation (max 50MB, valid CSV format)
- Sample rows preview

**Step 2: Map Fields**
- Two-column layout:
  - Left: CSV columns (auto-detected headers)
  - Right: Dropdown to select target field
- Auto-mapping suggestions (match by name)
- Preview mapped data (3 sample rows)

**Step 3: Import Options**
- Checkbox: "Update existing records if duplicate found"
- Checkbox: "Skip rows with errors"
- Dropdown: Duplicate detection method (domain, email, name)

**Step 4: Review & Confirm**
- Import summary: X rows, Y fields mapped
- Warnings: Missing required fields, potential duplicates
- Button: "Start Import"

**Step 5: Progress**
- Real-time progress bar
- "Importing row 2,450 of 10,000 (24%)"
- Live stats: Success, Skipped, Failed
- Cancel import button

**Step 6: Results**
- Success message: "9,850 accounts imported successfully"
- Error report: Download CSV of 150 failed rows
- Actions: View imported accounts, Import another file

---

### 2. CRM Integration Settings

**Header:**
- "Connected CRMs" section
- Add CRM button (Salesforce, HubSpot, Pipedrive)

**Per CRM Card:**
- Logo, provider name, connection status
- Last synced: "2 hours ago"
- Next sync: "In 30 minutes"
- Actions: Configure, Sync Now, Disconnect

**Configuration Modal:**

**Tab 1: Connection**
- OAuth status: Connected as user@company.com
- Reconnect button
- Test connection button

**Tab 2: Field Mapping**
- Table with columns: CRM Field, App Field, Sync Direction
- Add custom mapping button

**Tab 3: Sync Rules**
- Sync frequency: Dropdown (Real-time, Hourly, Daily, Manual)
- Sync direction: Radio (Bidirectional, Push Only, Pull Only)
- Conflict resolution: Dropdown (Last write wins, CRM wins, App wins)
- Filters: "Only sync accounts where Owner = Current User"

**Tab 4: Sync History**
- Table: Timestamp, Direction, Records Synced, Status
- View details button per sync

---

### 3. Data Enrichment Dashboard

**Header:**
- Credits remaining: "2,450 / 5,000 credits"
- Reset date: "Resets on Jan 1, 2025"

**Enrichment Providers:**
- Cards for Clearbit, ZoomInfo, Apollo
- Per card: Logo, available fields, cost per lookup
- Connect/Configure button

**Bulk Enrichment:**
- Select accounts: Multi-select or filter query
- Choose provider: Dropdown
- Select fields to enrich: Checkboxes
- Estimated cost: "250 credits (50 accounts × 5 fields)"
- Button: "Start Enrichment"

**Enrichment Queue:**
- Table of pending/processing enrichment jobs
- Columns: Job ID, Accounts, Provider, Status, Progress

---

### 4. Duplicate Management

**Duplicate Candidates List:**
- Table with columns:
  - Entities (side-by-side comparison)
  - Similarity Score (90%)
  - Matching Fields (domain, name)
  - Actions
- Sort by: Similarity score (high to low)
- Filter by: Entity type, status

**Duplicate Detail View:**
- Split view comparing two records
- Highlighted differences
- Similarity breakdown: Domain match (100%), Name match (85%)
- Resolution actions:
  - Button: "Merge → Keep Left"
  - Button: "Merge → Keep Right"
  - Button: "Not a Duplicate"
  - Button: "Ignore"

**Merge Preview Modal:**
- Shows merged record with field selection
- Checkboxes to choose which value to keep per field
- Warning: "This action cannot be undone"
- Confirm merge button

---

## 🔐 Security & Data Quality

### CSV Import Security

1. **File Validation**: Max 50MB, valid CSV format, limit 100K rows
2. **Malicious Content Detection**: Scan for formulas (CSV injection)
3. **Rate Limiting**: 10 imports per workspace per hour
4. **Sandboxed Processing**: Import jobs run in isolated environment

### CRM Integration Security

1. **OAuth 2.0**: Use OAuth for CRM authentication (never store passwords)
2. **Token Encryption**: Encrypt OAuth tokens at rest (AES-256)
3. **Token Rotation**: Refresh tokens before expiration
4. **Scope Limitation**: Request minimum necessary CRM permissions
5. **Audit Logging**: Log all CRM sync operations

### Enrichment Security

1. **API Key Management**: Store enrichment provider keys in Supabase Vault
2. **Rate Limiting**: Respect provider rate limits
3. **Credit Tracking**: Monitor usage, alert before quota exhausted
4. **Cache-First Strategy**: Check cache before external API call
5. **PII Handling**: Comply with data privacy regulations

### Duplicate Detection Algorithm

```typescript
function calculateSimilarity(record1: Account, record2: Account): number {
  let score = 0
  let maxScore = 0

  // Domain exact match (highest weight)
  if (record1.domain && record2.domain) {
    maxScore += 40
    if (normalizeDomain(record1.domain) === normalizeDomain(record2.domain)) {
      score += 40
    }
  }

  // Name fuzzy match (Levenshtein distance)
  if (record1.name && record2.name) {
    maxScore += 30
    const similarity = fuzzyMatch(record1.name, record2.name)
    score += 30 * similarity
  }

  // Email domain match
  if (record1.email && record2.email) {
    maxScore += 20
    const domain1 = extractDomain(record1.email)
    const domain2 = extractDomain(record2.email)
    if (domain1 === domain2) score += 20
  }

  // Address match
  if (record1.headquarters_city && record2.headquarters_city) {
    maxScore += 10
    if (record1.headquarters_city === record2.headquarters_city) score += 10
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0
}

// Flag as duplicate if score >= 80%
```

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  CSV parsing and validation
- [ ]  Field mapping transformation
- [ ]  Duplicate detection algorithm (80%+ matches flagged)
- [ ]  Domain normalization
- [ ]  CRM field mapping logic

### Integration Tests

- [ ]  End-to-end CSV import (1000 rows)
- [ ]  Salesforce OAuth flow and sync
- [ ]  HubSpot OAuth flow and sync
- [ ]  Clearbit enrichment API integration
- [ ]  Duplicate merge operation
- [ ]  Conflict resolution strategies

### Performance Tests

- [ ]  Import 10,000 rows in <2 minutes
- [ ]  CRM sync 1,000 records in <5 minutes
- [ ]  Duplicate detection on 10,000 accounts in <10 minutes
- [ ]  Concurrent imports (5 users importing simultaneously)

### Data Quality Tests

- [ ]  Duplicate detection accuracy: 90%+ precision/recall
- [ ]  Email validation accuracy
- [ ]  Import error handling (malformed CSV)
- [ ]  CRM sync conflict resolution correctness
- [ ]  Data transformation preserves integrity

---

## 📦 Dependencies & Libraries

### Backend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "jsforce": "^2.0.0",
    "@hubspot/api-client": "^10.1.0",
    "clearbit": "^1.3.4",
    "fuzzball": "^2.1.2",
    "email-validator": "^2.0.4",
    "dns-promises": "^1.0.0"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-dropzone": "^14.2.3",
    "papaparse": "^5.4.1",
    "@tanstack/react-query": "^5.17.0"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: CSV Import & Duplicate Detection

**Days 1-2:**
- [ ]  Build CSV upload and parsing
- [ ]  Create field mapping UI
- [ ]  Implement import preview

**Days 3-4:**
- [ ]  Build background import job handler
- [ ]  Add duplicate detection algorithm
- [ ]  Create duplicate management UI

**Day 5:**
- [ ]  Test with 10K row import
- [ ]  Optimize performance
- [ ]  Bug fixes

### Week 2: CRM Integration & Enrichment

**Days 1-2:**
- [ ]  Salesforce OAuth integration
- [ ]  Bidirectional sync implementation
- [ ]  Field mapping configuration

**Days 3-4:**
- [ ]  HubSpot integration
- [ ]  Clearbit enrichment integration
- [ ]  Enrichment cache system

**Day 5:**
- [ ]  End-to-end testing
- [ ]  Performance optimization
- [ ]  Documentation

---

## 🎯 Definition of Done

- [ ]  CSV import of 10K rows completes in <2 minutes
- [ ]  Salesforce sync working bidirectionally
- [ ]  HubSpot sync working bidirectionally
- [ ]  Clearbit enrichment operational
- [ ]  Duplicate detection 90%+ accurate
- [ ]  All UI screens built and tested
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Performance benchmarks met
- [ ]  Documentation complete
- [ ]  Code reviewed and deployed

---

## 🔮 Future Enhancements

1. **More CRM Integrations**: Pipedrive, Zoho, Copper
2. **More Enrichment Providers**: ZoomInfo, Apollo, Hunter
3. **Smart Field Mapping**: AI-powered field mapping suggestions
4. **Auto-Deduplication**: Automatically merge duplicates above 95% similarity
5. **Data Validation Rules**: Custom validation rules per workspace
6. **Import Templates**: Save and reuse import configurations
7. **Webhook-Based Sync**: Real-time CRM sync via webhooks
8. **Data Normalization**: Auto-normalize phone numbers, addresses
9. **Bulk Export**: Export to CSV/Excel with custom fields
10. **API-Based Import**: Import via REST API for programmatic access

---

## 📚 Resources

- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [HubSpot API](https://developers.hubspot.com/docs/api/overview)
- [Clearbit API](https://clearbit.com/docs)
- [CSV Injection Prevention](https://owasp.org/www-community/attacks/CSV_Injection)
- [Fuzzy String Matching](https://github.com/nol13/fuzzball.js)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

**Product Manager:** ___ **Date:** __
