# F001: Data Quality & Import System

## 📋 Overview

**Feature ID:** F001
**Priority:** P0 - Critical Foundation
**Timeline:** Week 3-4 (Sprint 1)
**Dependencies:** F002 (Database), F004 (Auth), F044 (Data Pipeline)
**Status:** 60% Complete

---

## 🎯 Goals

Build a data quality system that:

1. ✅ Imports accounts from CSV files (10K rows in <2 minutes) - **COMPLETE**
2. ✅ Enriches data automatically with Apollo.io - **COMPLETE**
3. Detects and handles duplicates with 90%+ accuracy
4. Caches enrichment results to avoid redundant API calls
5. Provides duplicate merge and management tools
6. Maintains data quality through validation and normalization

**Note:** REST API/Webhooks covered in F005, CRM integrations moved to F030

---

## 👥 User Stories

### CSV Import (✅ COMPLETE)

1. ✅ **As a sales ops admin**, I want to import 10,000 accounts from CSV so I can quickly populate our TAM
2. ✅ **As a user**, I want to map CSV columns to account fields so imports match our data model
3. ✅ **As a user**, I want to preview import results so I can catch errors before committing
4. ✅ **As a system**, I want to detect duplicates during import so we don't create redundant records

### Data Enrichment (✅ COMPLETE)

1. ✅ **As an SDR**, I want accounts auto-enriched with firmographics so I have context
2. ✅ **As a user**, I want bulk enrichment so I can enrich multiple accounts at once
3. ✅ **As an admin**, I want to control enrichment spend so we stay within budget
4. **As a system**, I want to cache enrichment results so we don't pay twice

### Data Quality (TO IMPLEMENT)

1. **As a user**, I want duplicate detection on account creation so we maintain clean data
2. **As an admin**, I want to review and merge duplicates so we consolidate records
3. **As a system**, I want to validate data on import so bad records are flagged
4. **As a compliance officer**, I want import audit logs so I can trace data lineage
5. **As a user**, I want to see duplicate candidates ranked by similarity score
6. **As a user**, I want to merge duplicates while choosing which field values to keep

---

## ✅ Success Criteria

### Performance Requirements

- [x]  CSV import: 10,000 rows in <2 minutes
- [x]  Enrichment: <3 seconds per account
- [ ]  Duplicate detection: <1 second per record
- [ ]  Duplicate scan: 10,000 accounts in <10 minutes
- [x]  Import validation: <500ms per row

### Functional Requirements

- [x]  CSV import with field mapping working
- [x]  CSV import preview and validation functional
- [x]  Apollo.io enrichment integrated and working
- [x]  Bulk enrichment operations working
- [ ]  Duplicate detection 90%+ accuracy
- [ ]  Enrichment cache system operational
- [ ]  Duplicate management UI functional
- [ ]  Merge operations with field selection

### Data Quality Requirements

- [x]  Email validation using regex
- [x]  Domain normalization (www.example.com → example.com)
- [ ]  Duplicate detection algorithm (domain, name, email)
- [x]  Import error reporting comprehensive
- [ ]  Audit trail for duplicate merges

---

## 🏗️ Technical Architecture

### Database Schema Extensions

```sql
-- Import Jobs (extends jobs table from F044)
-- Already implemented in F044-B

-- Enrichment Cache
CREATE TABLE enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Cache Key
  provider VARCHAR(50) NOT NULL, -- 'apollo', 'clearbit', 'zoominfo'
  lookup_type VARCHAR(50) NOT NULL, -- 'domain', 'email', 'company_name'
  lookup_value VARCHAR(255) NOT NULL,

  -- Cached Data
  enrichment_data JSONB NOT NULL,
  data_version INT DEFAULT 1,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Cache expiration (30 days default)
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

### CSV Import (✅ COMPLETE - F044-B)

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

### Data Enrichment (✅ COMPLETE - F044-A)

```
POST   /api/jobs (with job_type: 'enrich_account')
Body: { workspace_id, job_type, payload: { account_id, domain } }
Response: { job }

GET    /api/jobs/:id
Response: { job, logs }

GET    /api/enrichment-credits
Response: { remaining, used, limit, resetDate }
```

### Enrichment Cache (TO IMPLEMENT)

```
GET    /api/enrichment/cache/:provider/:lookup_type/:lookup_value
Response: { cached_data, created_at, expires_at }

POST   /api/enrichment/cache
Body: { provider, lookup_type, lookup_value, enrichment_data }
Response: { cache_entry }

DELETE /api/enrichment/cache/:id
Response: { success: true }

GET    /api/enrichment/cache/stats
Response: { hit_rate, total_hits, total_misses, cache_size }
```

### Duplicate Management (TO IMPLEMENT)

```
GET    /api/duplicates
Query: { entityType?, status?, minScore? }
Response: { duplicates: [] }

POST   /api/duplicates/:id/merge
Body: { keepId, mergeId, strategy }
Response: { mergedRecord }

PATCH  /api/duplicates/:id/resolve
Body: { status: 'not_duplicate' | 'ignored' }
Response: { duplicate }

POST   /api/duplicates/detect
Body: { entityType, entityId? }
Response: { job_id }

GET    /api/duplicates/stats
Response: { pending_count, total_detected, auto_merged }
```

---

## 🎨 UI/UX Screens

### 1. CSV Import Wizard (✅ COMPLETE - F044-B)

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

### 2. Duplicate Management (TO IMPLEMENT)

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

### CSV Import Security (✅ COMPLETE)

1. **File Validation**: Max 50MB, valid CSV format, limit 100K rows
2. **Malicious Content Detection**: Scan for formulas (CSV injection)
3. **Rate Limiting**: 10 imports per workspace per hour
4. **Sandboxed Processing**: Import jobs run in isolated environment

### Enrichment Security (✅ COMPLETE)

1. **API Key Management**: Store Apollo API keys in Supabase Vault
2. **Rate Limiting**: Respect Apollo.io rate limits
3. **Credit Tracking**: Monitor usage, alert before quota exhausted
4. **PII Handling**: Comply with data privacy regulations (GDPR, CCPA)

### Enrichment Cache Security (TO IMPLEMENT)

1. **Cache Expiration**: Auto-expire cached data after 30 days
2. **Workspace Isolation**: RLS ensures users only access their workspace cache
3. **Cache Invalidation**: Allow manual cache clearing
4. **Data Minimization**: Only cache necessary enrichment fields

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

- [x]  CSV parsing and validation
- [x]  Field mapping transformation
- [ ]  Duplicate detection algorithm (80%+ matches flagged)
- [x]  Domain normalization
- [ ]  Enrichment cache hit/miss logic

### Integration Tests

- [x]  End-to-end CSV import (1000 rows)
- [x]  Apollo.io enrichment API integration
- [ ]  Duplicate merge operation
- [ ]  Enrichment cache read/write
- [ ]  Duplicate detection job processing

### Performance Tests

- [x]  Import 10,000 rows in <2 minutes
- [ ]  Duplicate detection on 10,000 accounts in <10 minutes
- [x]  Concurrent imports (5 users importing simultaneously)
- [ ]  Cache lookup performance (<10ms)

### Data Quality Tests

- [ ]  Duplicate detection accuracy: 90%+ precision/recall
- [x]  Email validation accuracy
- [x]  Import error handling (malformed CSV)
- [ ]  Merge operation data integrity
- [ ]  Cache expiration and cleanup

---

## 📦 Dependencies & Libraries

### Backend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "papaparse": "^5.4.1",
    "fuzzball": "^2.1.2"
  }
}
```

**Note:** CSV parsing (`papaparse`) and duplicate detection (`fuzzball`) are the only new dependencies needed. Apollo.io integration already exists in F044-A.

### Frontend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "papaparse": "^5.4.1",
    "@tanstack/react-query": "^5.17.0"
  }
}
```

**Note:** All frontend dependencies already installed for F044-B (CSV import).

---

## 🚀 Implementation Plan

### Week 1: Enrichment Cache & Duplicate Detection

**Days 1-2:**
- [ ]  Create `enrichment_cache` database table and RLS policies
- [ ]  Implement cache service layer (check cache, write cache, invalidate)
- [ ]  Integrate cache into Apollo enrichment worker
- [ ]  Add cache stats API endpoint

**Days 3-4:**
- [ ]  Create `duplicate_candidates` database table and RLS policies
- [ ]  Implement duplicate detection algorithm (domain, name, email matching)
- [ ]  Create background job for scanning duplicates
- [ ]  Test algorithm accuracy with sample data

**Day 5:**
- [ ]  Build duplicate detection API endpoints
- [ ]  Test cache hit/miss performance
- [ ]  Optimize duplicate detection query performance

### Week 2: Duplicate Management UI

**Days 1-2:**
- [ ]  Create `/duplicates` page with candidate list
- [ ]  Build duplicate detail view with side-by-side comparison
- [ ]  Implement similarity score visualization

**Days 3-4:**
- [ ]  Build merge operation UI with field selection
- [ ]  Implement merge API endpoint and data consolidation
- [ ]  Add "not a duplicate" / "ignore" actions

**Day 5:**
- [ ]  End-to-end testing (detect → review → merge)
- [ ]  Performance optimization
- [ ]  Documentation and deployment

---

## 🎯 Definition of Done

- [x]  CSV import of 10K rows completes in <2 minutes
- [x]  Apollo.io enrichment operational
- [x]  All CSV import UI screens built and tested
- [ ]  Enrichment cache system operational
- [ ]  Duplicate detection 90%+ accurate
- [ ]  Duplicate management UI functional
- [ ]  Merge operations working correctly
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Performance benchmarks met
- [ ]  Documentation complete
- [ ]  Code reviewed and deployed

---

## 🔮 Future Enhancements

1. **Auto-Deduplication**: Automatically merge duplicates above 95% similarity
2. **Smart Duplicate Detection**: Machine learning-based duplicate detection
3. **Bulk Merge Operations**: Merge multiple duplicate groups at once
4. **Data Validation Rules**: Custom validation rules per workspace
5. **Import Templates**: Save and reuse import configurations
6. **Data Normalization**: Auto-normalize phone numbers, addresses
7. **Bulk Export**: Export to CSV/Excel with custom fields
8. **Enrichment Provider Rotation**: Fallback to secondary providers
9. **Cache Analytics**: Dashboard showing cache hit rates and savings
10. **Duplicate Prevention**: Real-time duplicate alerts during account creation

**Note:** CRM integrations (Salesforce, HubSpot) moved to F030. REST API/Webhooks covered in F005.

---

## 📚 Resources

- [Apollo.io API Docs](https://apolloio.github.io/apollo-api-docs/)
- [CSV Injection Prevention](https://owasp.org/www-community/attacks/CSV_Injection)
- [Fuzzy String Matching](https://github.com/nol13/fuzzball.js)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

**Product Manager:** ___ **Date:** __
