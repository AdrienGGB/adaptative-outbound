# F002: Account Database & Core Data Schema

## 📋 Overview

**Feature ID:** F002
**Priority:** P0 - Critical Foundation
**Timeline:** Week 2-4 (Sprint 1)
**Dependencies:** F004 (User Authentication)
**Status:** Ready for Development

---

## 🎯 Goals

Build the foundational data layer that:

1. Stores accounts (companies) and contacts (people) reliably
2. Tracks all activities and interactions
3. Supports custom fields for flexible data modeling
4. Maintains complete audit trail with versioning
5. Scales to 10M+ accounts per workspace
6. Provides sub-100ms query performance

---

## 👥 User Stories

### Account Management

1. **As an SDR**, I want to create an account so I can start prospecting
2. **As a user**, I want to see all account details in one place so I have context
3. **As a sales ops admin**, I want to import 10,000 accounts so I can build our TAM quickly
4. **As a user**, I want to search accounts by name/domain so I can find them fast
5. **As an admin**, I want to define account hierarchies so I understand parent/subsidiary relationships

### Contact Management

1. **As an SDR**, I want to add contacts to accounts so I can track decision-makers
2. **As a user**, I want to see a contact's full history so I know our relationship
3. **As a sales rep**, I want to identify champions so I can leverage internal advocates
4. **As a user**, I want to mark contacts as decision-makers so I know who has budget authority

### Activity Tracking

1. **As a user**, I want all my emails/calls logged automatically so I have a complete record
2. **As a sales manager**, I want to see team activity so I can coach effectively
3. **As a user**, I want to see the activity timeline so I understand engagement history
4. **As a system**, I want to trigger automations based on activities so I can execute sequences

### Custom Fields & Flexibility

1. **As an admin**, I want to add custom fields so I can track company-specific data
2. **As a user**, I want to tag accounts so I can organize them my way
3. **As a developer**, I want a flexible schema so I can add features without migrations

### Data Quality & History

1. **As a user**, I want to see who changed what data so I can audit changes
2. **As an admin**, I want to restore previous versions so I can undo mistakes
3. **As a compliance officer**, I want immutable audit logs so I can prove data integrity

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Schema supports 10M+ accounts per workspace
- [ ]  CRUD operations for accounts functional
- [ ]  CRUD operations for contacts functional
- [ ]  Activity logging working (email, call, meeting, etc.)
- [ ]  Full-text search working (accounts and contacts)
- [ ]  Custom fields creation and management working
- [ ]  Tags and labels functional
- [ ]  Account hierarchy (parent/child) working
- [ ]  Data versioning operational (audit trail)
- [ ]  Soft deletes (archive) implemented

### Performance Requirements

- [ ]  Account create/update: <50ms
- [ ]  Account read: <100ms
- [ ]  Search query: <200ms (p99)
- [ ]  Activity log query: <150ms
- [ ]  Full-text search: <300ms with 1M+ records
- [ ]  Support 10,000 concurrent queries

### Data Integrity Requirements

- [ ]  Multi-tenant isolation verified (zero cross-workspace leaks)
- [ ]  Foreign key constraints enforced
- [ ]  Transactions used for multi-table operations
- [ ]  Unique constraints on email/domain per workspace
- [ ]  Data validation on all writes

---

## 🏗️ Technical Architecture

### Core Database Schema

### 1. Accounts (Companies)

```sql
CREATE TABLE accounts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_id VARCHAR(100), -- ID from CRM or other source

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  website TEXT,
  description TEXT,
  logo_url TEXT,

  -- Firmographics
  industry VARCHAR(100),
  sub_industry VARCHAR(100),
  employee_count INT,
  employee_range VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
  annual_revenue BIGINT, -- in cents to avoid floating point issues
  revenue_range VARCHAR(50), -- '$0-$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '$500M+'

  -- Location
  headquarters_address TEXT,
  headquarters_city VARCHAR(100),
  headquarters_state VARCHAR(100),
  headquarters_country VARCHAR(2), -- ISO 3166-1 alpha-2 code
  headquarters_postal_code VARCHAR(20),
  headquarters_timezone VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Business Details
  founded_year INT,
  business_model VARCHAR(50), -- 'B2B', 'B2C', 'B2B2C', 'Marketplace'
  company_type VARCHAR(50), -- 'Public', 'Private', 'Non-profit', 'Government'
  stock_ticker VARCHAR(10),
  naics_code VARCHAR(10), -- North American Industry Classification System
  sic_code VARCHAR(10), -- Standard Industrial Classification

  -- Financial Signals
  funding_stage VARCHAR(50), -- 'Bootstrapped', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO', 'Acquired'
  funding_total BIGINT, -- total raised in cents
  last_funding_date DATE,
  last_funding_amount BIGINT,
  last_funding_type VARCHAR(50), -- 'Seed', 'Series A', 'Venture', 'Private Equity', 'Debt'
  investors TEXT[], -- array of investor names

  -- Technology Stack
  technologies JSONB DEFAULT '{}',
  -- Structure: {"category": ["tool1", "tool2"]}
  -- Example: {"crm": ["Salesforce"], "marketing": ["HubSpot", "Marketo"], "analytics": ["Google Analytics"]}
  tech_stack_last_updated TIMESTAMP,

  -- Social & Web Presence
  linkedin_url TEXT,
  linkedin_id VARCHAR(50),
  twitter_handle VARCHAR(50),
  twitter_url TEXT,
  facebook_url TEXT,
  crunchbase_url TEXT,
  github_url TEXT,

  -- Status & Classification
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'merged', 'duplicate'
  account_tier VARCHAR(20), -- 'enterprise', 'mid-market', 'smb', 'startup'
  lifecycle_stage VARCHAR(50), -- 'target', 'engaged', 'opportunity', 'customer', 'churned'

  -- Ownership & Assignment
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Parent/Child Relationships (for corporate hierarchies)
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ultimate_parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- root of hierarchy

  -- Computed/Cached Fields (for performance)
  contact_count INT DEFAULT 0,
  activity_count INT DEFAULT 0,
  open_opportunity_count INT DEFAULT 0,

  -- Metadata
  source VARCHAR(50), -- 'import', 'crm_sync', 'manual', 'enrichment', 'web_form'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP,
  last_enriched_at TIMESTAMP,

  -- Search Optimization (full-text search)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(industry, '')), 'D')
  ) STORED,

  -- Constraints
  UNIQUE(workspace_id, domain) WHERE domain IS NOT NULL,
  CHECK(employee_count >= 0),
  CHECK(annual_revenue >= 0),
  CHECK(founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Indexes for Performance
CREATE INDEX idx_accounts_workspace ON accounts(workspace_id);
CREATE INDEX idx_accounts_domain ON accounts(domain);
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_owner ON accounts(owner_id);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_status ON accounts(status) WHERE status = 'active';
CREATE INDEX idx_accounts_industry ON accounts(industry);
CREATE INDEX idx_accounts_employee_range ON accounts(employee_range);
CREATE INDEX idx_accounts_lifecycle ON accounts(lifecycle_stage);
CREATE INDEX idx_accounts_last_activity ON accounts(last_activity_at DESC NULLS LAST);
CREATE INDEX idx_accounts_search ON accounts USING GIN(search_vector);
CREATE INDEX idx_accounts_created_at ON accounts(created_at DESC);

-- RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts in their workspace"
  ON accounts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create accounts in their workspace"
  ON accounts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update accounts in their workspace"
  ON accounts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete accounts"
  ON accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = accounts.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('admin', 'sales_manager')
    )
  );

```

### 2. Contacts (People)

```sql
CREATE TABLE contacts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  external_id VARCHAR(100),

  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),
  direct_dial VARCHAR(50),

  -- Professional Details
  job_title VARCHAR(255),
  normalized_title VARCHAR(100), -- standardized: 'CEO', 'CTO', 'VP Sales', etc.
  department VARCHAR(100), -- 'Sales', 'Marketing', 'Engineering', 'Finance', 'Operations', 'HR', 'IT'
  seniority_level VARCHAR(50), -- 'C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'
  reports_to_id UUID REFERENCES contacts(id), -- organizational hierarchy

  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(2),
  timezone VARCHAR(50),

  -- Social Profiles
  linkedin_url TEXT,
  linkedin_id VARCHAR(50),
  twitter_handle VARCHAR(50),
  twitter_url TEXT,
  github_username VARCHAR(100),

  -- Contact Information Quality
  email_status VARCHAR(20) DEFAULT 'unverified', -- 'verified', 'unverified', 'bounced', 'invalid', 'catch_all'
  phone_status VARCHAR(20), -- 'verified', 'unverified', 'invalid'
  last_verified_at TIMESTAMP,

  -- Status & Preferences
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'bounced', 'opted_out', 'invalid', 'archived'
  do_not_contact BOOLEAN DEFAULT FALSE,
  opted_out_at TIMESTAMP,
  bounce_reason TEXT,

  -- Relationship & Influence
  is_decision_maker BOOLEAN DEFAULT FALSE,
  is_champion BOOLEAN DEFAULT FALSE,
  is_blocker BOOLEAN DEFAULT FALSE,
  buying_role VARCHAR(50), -- 'Economic Buyer', 'Technical Buyer', 'User', 'Coach', 'Influencer'
  influence_score INT CHECK(influence_score >= 0 AND influence_score <= 100),
  engagement_level VARCHAR(20), -- 'hot', 'warm', 'cold', 'unengaged'

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Computed Fields
  activity_count INT DEFAULT 0,
  email_sent_count INT DEFAULT 0,
  email_opened_count INT DEFAULT 0,
  email_replied_count INT DEFAULT 0,

  -- Metadata
  source VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_contacted_at TIMESTAMP,
  last_enriched_at TIMESTAMP,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(job_title, '')), 'C')
  ) STORED,

  -- Constraints
  UNIQUE(workspace_id, email) WHERE email IS NOT NULL AND status != 'archived',
  CHECK(email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- Indexes
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_status ON contacts(status) WHERE status = 'active';
CREATE INDEX idx_contacts_department ON contacts(department);
CREATE INDEX idx_contacts_seniority ON contacts(seniority_level);
CREATE INDEX idx_contacts_decision_maker ON contacts(is_decision_maker) WHERE is_decision_maker = TRUE;
CREATE INDEX idx_contacts_last_contacted ON contacts(last_contacted_at DESC NULLS LAST);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX idx_contacts_reports_to ON contacts(reports_to_id);

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their workspace"
  ON contacts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts in their workspace"
  ON contacts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in their workspace"
  ON contacts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete contacts"
  ON contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = contacts.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('admin', 'sales_manager')
    )
  );

```

### 3. Activities (Interaction History)

```sql
CREATE TABLE activities (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Relationships
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who performed the activity

  -- Activity Classification
  activity_type VARCHAR(50) NOT NULL,
  -- Types: 'email_sent', 'email_opened', 'email_clicked', 'email_replied', 'email_bounced',
  --        'call_completed', 'call_missed', 'call_voicemail',
  --        'meeting_scheduled', 'meeting_held', 'meeting_no_show',
  --        'linkedin_message_sent', 'linkedin_connection_request', 'linkedin_connection_accepted',
  --        'website_visit', 'content_downloaded', 'demo_completed', 'trial_started',
  --        'note_added', 'task_completed'

  activity_category VARCHAR(50), -- 'email', 'call', 'meeting', 'social', 'website', 'note'

  -- Activity Content
  subject TEXT,
  description TEXT,
  body TEXT, -- full email body, call transcript, meeting notes, etc.

  -- Activity Data (flexible JSON storage)
  activity_data JSONB DEFAULT '{}',
  -- email: {to: [], cc: [], bcc: [], from: '', thread_id: '', message_id: '', attachments: []}
  -- call: {duration_seconds: 300, outcome: 'positive', recording_url: '', transcript_url: ''}
  -- meeting: {attendees: [], duration_minutes: 60, meeting_url: '', calendar_event_id: ''}
  -- linkedin: {message_text: '', connection_degree: '1st', profile_url: ''}

  -- Outcome & Sentiment
  outcome VARCHAR(50), -- 'positive', 'neutral', 'negative', 'no_answer', 'not_interested', 'interested'
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0 (from AI analysis)

  -- Timing
  occurred_at TIMESTAMP NOT NULL,
  duration_seconds INT,
  scheduled_for TIMESTAMP, -- for future activities

  -- Source Tracking
  source VARCHAR(50), -- 'manual', 'crm_sync', 'email_tracking', 'sequence', 'api', 'chrome_extension'
  source_id UUID, -- ID in source system (e.g., sequence_step_id, campaign_id)
  external_id VARCHAR(255), -- ID from external system (Salesforce, etc.)

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK(sentiment_score >= -1.0 AND sentiment_score <= 1.0),
  CHECK(duration_seconds >= 0)
);

-- Indexes
CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_account ON activities(account_id, occurred_at DESC);
CREATE INDEX idx_activities_contact ON activities(contact_id, occurred_at DESC);
CREATE INDEX idx_activities_user ON activities(user_id, occurred_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_category ON activities(activity_category);
CREATE INDEX idx_activities_occurred ON activities(occurred_at DESC);
CREATE INDEX idx_activities_source ON activities(source, source_id);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their workspace"
  ON activities FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities in their workspace"
  ON activities FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Partitioning for scale (optional, for large datasets)
-- Partition by occurred_at month for better query performance

```

### 4. Custom Fields

```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Field Definition
  entity_type VARCHAR(20) NOT NULL, -- 'account', 'contact', 'opportunity'
  field_name VARCHAR(100) NOT NULL, -- internal name (snake_case)
  field_label VARCHAR(100) NOT NULL, -- display name
  field_type VARCHAR(20) NOT NULL,
  -- Types: 'text', 'number', 'decimal', 'date', 'datetime', 'boolean',
  --        'select', 'multi_select', 'url', 'email', 'phone', 'textarea'

  -- Configuration
  is_required BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,

  -- For select/multi_select types
  options JSONB,
  -- [{value: 'option1', label: 'Option 1', color: 'blue'}, ...]

  -- Validation Rules
  validation_rules JSONB,
  -- {min: 0, max: 100, pattern: '^[A-Z]{2}$', min_length: 5, max_length: 255}

  -- Display
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  help_text TEXT,
  placeholder TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, entity_type, field_name)
);

-- RLS Policies
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom fields in their workspace"
  ON custom_fields FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage custom fields"
  ON custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = custom_fields.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- references account.id, contact.id, etc.

  -- Polymorphic value storage
  text_value TEXT,
  number_value BIGINT,
  decimal_value DECIMAL(20,4),
  date_value DATE,
  datetime_value TIMESTAMP,
  boolean_value BOOLEAN,
  json_value JSONB, -- for multi_select, arrays, objects

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(custom_field_id, entity_id)
);

CREATE INDEX idx_custom_fields_workspace ON custom_fields(workspace_id, entity_type);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(custom_field_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX idx_custom_field_values_text ON custom_field_values(text_value) WHERE text_value IS NOT NULL;
CREATE INDEX idx_custom_field_values_number ON custom_field_values(number_value) WHERE number_value IS NOT NULL;

-- RLS for custom_field_values (inherits permissions from custom_fields)
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom field values for accessible entities"
  ON custom_field_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      JOIN workspace_members wm ON wm.workspace_id = cf.workspace_id
      WHERE cf.id = custom_field_values.custom_field_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage custom field values in their workspace"
  ON custom_field_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      JOIN workspace_members wm ON wm.workspace_id = cf.workspace_id
      WHERE cf.id = custom_field_values.custom_field_id
      AND wm.user_id = auth.uid()
    )
  );

```

### 5. Tags & Labels

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color code
  description TEXT,
  entity_type VARCHAR(20), -- 'account', 'contact', or NULL for all

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, name, entity_type)
);

-- RLS Policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in their workspace"
  ON tags FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tags in their workspace"
  ON tags FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE TABLE entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,

  tagged_by UUID REFERENCES auth.users(id),
  tagged_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tag_id, entity_type, entity_id)
);

CREATE INDEX idx_tags_workspace ON tags(workspace_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- RLS for entity_tags
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity tags in their workspace"
  ON entity_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tags t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = entity_tags.tag_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage entity tags in their workspace"
  ON entity_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tags t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = entity_tags.tag_id
      AND wm.user_id = auth.uid()
    )
  );

```

### 6. Account Hierarchies

```sql
CREATE TABLE account_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Hierarchy Relationship
  child_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  parent_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Relationship Type
  relationship_type VARCHAR(50) DEFAULT 'subsidiary',
  -- Types: 'subsidiary', 'division', 'franchise', 'partner', 'acquired'
  ownership_percentage DECIMAL(5,2), -- 0.00 to 100.00

  -- Materialized Path (for efficient hierarchical queries)
  path ltree, -- PostgreSQL ltree extension: 'root.parent.child'
  depth INT DEFAULT 0, -- 0 = direct parent, 1 = grandparent, etc.

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(child_account_id, parent_account_id),
  CHECK(child_account_id != parent_account_id) -- prevent self-reference
);

CREATE INDEX idx_hierarchies_child ON account_hierarchies(child_account_id);
CREATE INDEX idx_hierarchies_parent ON account_hierarchies(parent_account_id);
CREATE INDEX idx_hierarchies_path ON account_hierarchies USING GIST(path);
CREATE INDEX idx_hierarchies_workspace ON account_hierarchies(workspace_id);

-- RLS Policies
ALTER TABLE account_hierarchies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hierarchies in their workspace"
  ON account_hierarchies FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage hierarchies in their workspace"
  ON account_hierarchies FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

```

### 7. Data Versioning (Audit Trail)

```sql
CREATE TABLE account_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Snapshot
  data JSONB NOT NULL, -- full account data at this point in time

  -- Change Tracking
  changed_fields TEXT[], -- array of field names that changed
  change_type VARCHAR(20), -- 'created', 'updated', 'deleted', 'restored'
  changed_by UUID REFERENCES auth.users(id),
  change_source VARCHAR(50), -- 'user_edit', 'crm_sync', 'enrichment', 'import', 'api'
  change_reason TEXT, -- optional reason for the change

  -- Version Number
  version_number INT NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(account_id, version_number)
);

CREATE TABLE contact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  data JSONB NOT NULL,
  changed_fields TEXT[],
  change_type VARCHAR(20),
  changed_by UUID REFERENCES auth.users(id),
  change_source VARCHAR(50),
  change_reason TEXT,
  version_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(contact_id, version_number)
);

CREATE INDEX idx_account_versions_account ON account_versions(account_id, version_number DESC);
CREATE INDEX idx_account_versions_changed_by ON account_versions(changed_by, created_at DESC);
CREATE INDEX idx_contact_versions_contact ON contact_versions(contact_id, version_number DESC);

-- RLS Policies for versions
ALTER TABLE account_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view account versions in their workspace"
  ON account_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts a
      JOIN workspace_members wm ON wm.workspace_id = a.workspace_id
      WHERE a.id = account_versions.account_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view contact versions in their workspace"
  ON contact_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = contact_versions.contact_id
      AND wm.user_id = auth.uid()
    )
  );

```

### 8. Tasks (Manual Actions)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Assignments
  assigned_to UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  sequence_enrollment_id UUID REFERENCES sequence_enrollments(id),

  -- Task Details
  task_type VARCHAR(50) NOT NULL,
  -- Types: 'call', 'linkedin_message', 'linkedin_connect', 'research', 'demo', 'follow_up'
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Scheduling
  due_date TIMESTAMP,
  reminder_at TIMESTAMP,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- States: 'pending', 'in_progress', 'completed', 'cancelled'

  -- Completion
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP,
  completion_notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CHECK(priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_account ON tasks(account_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'completed';
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_sequence ON tasks(sequence_enrollment_id);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their workspace"
  ON tasks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their workspace"
  ON tasks FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their assigned tasks"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage all tasks in workspace"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('admin', 'sales_manager')
    )
  );
```

---

## 🔌 API Endpoints

**Note:** Use Next.js API Routes or Supabase Edge Functions. Client-side can also use Supabase client directly with automatic RLS enforcement.

### Accounts

```
POST   /api/accounts
GET    /api/accounts
GET    /api/accounts/:id
PATCH  /api/accounts/:id
DELETE /api/accounts/:id (soft delete)
GET    /api/accounts/:id/contacts
GET    /api/accounts/:id/activities
GET    /api/accounts/:id/hierarchy
GET    /api/accounts/:id/versions
POST   /api/accounts/:id/restore/:version
GET    /api/accounts/search?q=:query
POST   /api/accounts/bulk (bulk create/update)
DELETE /api/accounts/bulk (bulk delete)

```

### Contacts

```
POST   /api/contacts
GET    /api/contacts
GET    /api/contacts/:id
PATCH  /api/contacts/:id
DELETE /api/contacts/:id
GET    /api/contacts/:id/activities
GET    /api/contacts/:id/versions
GET    /api/contacts/search?q=:query
POST   /api/contacts/bulk

```

### Activities

```
POST   /api/activities
GET    /api/activities
GET    /api/activities/:id
PATCH  /api/activities/:id
DELETE /api/activities/:id
GET    /api/activities/timeline (combined account + contact timeline)

```

### Custom Fields

```
POST   /api/custom-fields
GET    /api/custom-fields?entityType=account
GET    /api/custom-fields/:id
PATCH  /api/custom-fields/:id
DELETE /api/custom-fields/:id
POST   /api/custom-fields/:id/values (bulk set values for multiple entities)
GET    /api/entities/:type/:id/custom-fields (get all custom field values for entity)

```

### Tags

```
POST   /api/tags
GET    /api/tags
PATCH  /api/tags/:id
DELETE /api/tags/:id
POST   /api/entities/:type/:id/tags (add tag to entity)
DELETE /api/entities/:type/:id/tags/:tagId
GET    /api/entities/:type/:id/tags

```

### Tasks

```
POST   /api/tasks
GET    /api/tasks?assignedTo=&status=&dueDate=
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/complete
GET    /api/contacts/:id/tasks
GET    /api/accounts/:id/tasks

```

---

## 🎨 UI/UX Screens

### 1. Account Detail Page

- **Header:** Account name, domain, logo, status badge, owner
- **Tabs:**
    - Overview (firmographics, location, financial data)
    - Contacts (table of contacts at this account)
    - Activity (timeline of all interactions)
    - Hierarchy (org chart of parent/child accounts)
    - Custom Fields
    - History (version history)
- **Actions:** Edit, Delete, Assign Owner, Add to List

### 2. Contact Detail Page

- **Header:** Name, job title, email, phone, account link
- **Sections:**
    - Profile (photo, social links, location)
    - Role & Influence (decision maker badges, buying role)
    - Activity Timeline
    - Relationships (reports to, reporting structure)
- **Actions:** Edit, Delete, Send Email, Add to Sequence

### 3. Activity Timeline

- **Display:** Chronological list with icons per type
- **Filters:** Type, Date Range, User
- **Actions:** Add Note, Log Call, Add Meeting

### 4. Custom Fields Management (Admin)

- **Table:** Field Name, Type, Required, Visible
- **Actions:** Create Field, Edit Field, Delete Field
- **Modal:** Field creation wizard

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  Account CRUD operations
- [ ]  Contact CRUD operations
- [ ]  Activity logging
- [ ]  Custom field creation and value setting
- [ ]  Tag assignment
- [ ]  Hierarchy path calculation
- [ ]  Version creation on updates
- [ ]  Search query building

### Integration Tests

- [ ]  Create account → add contacts → log activities
- [ ]  Account hierarchy queries (parent/children)
- [ ]  Multi-tenant isolation (workspace A can't see workspace B)
- [ ]  Custom fields across accounts
- [ ]  Version restore functionality
- [ ]  Bulk operations (create 1000 accounts)
- [ ]  Search with full-text
- [ ]  Cascade deletes work correctly

### Performance Tests

- [ ]  Query 1M accounts <200ms
- [ ]  Full-text search 1M records <300ms
- [ ]  Insert 10K accounts in <30 seconds
- [ ]  Activity timeline for account with 1000 activities <150ms
- [ ]  Concurrent writes (100 users updating different accounts)

### Data Integrity Tests

- [ ]  Foreign keys prevent orphaned records
- [ ]  Unique constraints enforced per workspace
- [ ]  Transactions rollback on error
- [ ]  Soft delete doesn't break references
- [ ]  Version history is immutable

---

## 📦 Dependencies & Libraries

### Web App (Next.js)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.0",
    "@tanstack/react-query": "^5.17.0",
    "date-fns": "^3.0.0"
  }
}
```

### Mobile App (React Native + Expo)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "zod": "^3.22.4",
    "date-fns": "^3.0.0"
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