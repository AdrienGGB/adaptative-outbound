# F008: Target List Builder

## 📋 Overview

**Feature ID:** F008
**Priority:** P1 - Core Feature
**Timeline:** Week 11-12 (Sprint 3)
**Dependencies:** F002 (Database), F007 (Account Scoring)
**Status:** Ready for Development

---

## 🎯 Goals

Build a powerful list management system that:

1. Auto-generates lists by segment criteria
2. Enables manual list CRUD operations
3. Supports bulk actions (tag, assign, add to sequence)
4. Exports lists to CRM systems
5. Provides smart list recommendations
6. Tracks list performance metrics

---

## 👥 User Stories

### List Creation

1. **As an SDR**, I want to create account lists so I can organize my pipeline
2. **As a manager**, I want to auto-generate lists by segment so I can distribute accounts to reps
3. **As a user**, I want to save filter criteria as smart lists so they auto-update
4. **As a user**, I want to clone existing lists so I can create similar segments quickly

### List Management

1. **As an SDR**, I want to add/remove accounts from lists manually so I can curate my targets
2. **As a manager**, I want to assign list ownership so reps know their responsibility
3. **As a user**, I want to tag lists so I can categorize them (Tier 1, Cold, Warm, etc.)
4. **As a user**, I want to archive old lists so they don't clutter my workspace

### Bulk Operations

1. **As an SDR**, I want to bulk tag accounts so I can categorize them quickly
2. **As a user**, I want to bulk assign accounts to a rep so I can distribute work
3. **As a user**, I want to add entire list to sequence so I can launch campaigns
4. **As a user**, I want to bulk export to CRM so I can sync with Salesforce

### Smart Lists

1. **As a manager**, I want lists to auto-update when accounts match criteria so they stay current
2. **As a user**, I want to see list recommendations based on my ICP so I discover good targets
3. **As a system**, I want to suggest list refinements based on conversion data
4. **As a user**, I want to A/B test list criteria so I can optimize targeting

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Auto-generate lists by segment criteria
- [ ]  Manual list CRUD operations functional
- [ ]  Bulk tag operation working (1000+ accounts)
- [ ]  Bulk assign operation working
- [ ]  Bulk add to sequence working
- [ ]  Export to Salesforce/HubSpot functional
- [ ]  Smart lists auto-update on schedule
- [ ]  List cloning working
- [ ]  List sharing between team members

### Performance Requirements

- [ ]  List creation: <2 seconds
- [ ]  Load list (1000 accounts): <1 second
- [ ]  Bulk operations (1000 accounts): <10 seconds
- [ ]  Export to CRM (1000 accounts): <30 seconds
- [ ]  Smart list refresh: <5 seconds

### UX Requirements

- [ ]  Drag-and-drop accounts between lists
- [ ]  Multi-select with keyboard shortcuts
- [ ]  Undo bulk operations
- [ ]  Real-time list count updates
- [ ]  List performance metrics visible

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Lists (Target Account Lists)
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- List Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI

  -- List Type
  list_type VARCHAR(20) DEFAULT 'static',
  -- Types: 'static' (manual), 'smart' (auto-updating), 'imported'

  -- Smart List Criteria (for auto-updating lists)
  filter_criteria JSONB,
  -- {
  --   "industry": ["Technology", "SaaS"],
  --   "employee_range": "51-200",
  --   "fit_score_min": 70,
  --   "intent_score_min": 50,
  --   "tags": ["enterprise"]
  -- }

  auto_refresh BOOLEAN DEFAULT FALSE,
  last_refreshed_at TIMESTAMP,
  refresh_frequency VARCHAR(20), -- 'hourly', 'daily', 'weekly', 'manual'

  -- Ownership & Sharing
  owner_id UUID REFERENCES auth.users(id),
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_team BOOLEAN DEFAULT FALSE, -- Share with whole team
  shared_with_users UUID[], -- Specific users

  -- Metadata
  account_count INT DEFAULT 0, -- Cached count
  tags TEXT[],

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived'

  -- Performance Tracking
  total_outreach INT DEFAULT 0,
  total_replies INT DEFAULT 0,
  total_meetings INT DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK(list_type IN ('static', 'smart', 'imported'))
);

CREATE INDEX idx_lists_workspace ON lists(workspace_id);
CREATE INDEX idx_lists_owner ON lists(owner_id);
CREATE INDEX idx_lists_status ON lists(status) WHERE status = 'active';
CREATE INDEX idx_lists_type ON lists(list_type);
CREATE INDEX idx_lists_auto_refresh ON lists(auto_refresh) WHERE auto_refresh = TRUE;

-- RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lists they own or shared with them"
  ON lists FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    AND (
      owner_id = auth.uid()
      OR is_shared = TRUE
      OR auth.uid() = ANY(shared_with_users)
    )
  );

CREATE POLICY "Users can create lists in their workspace"
  ON lists FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (owner_id = auth.uid());

-- List Members (Many-to-Many: Lists ↔ Accounts)
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Membership Details
  position INT, -- For manual ordering
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP DEFAULT NOW(),

  -- Tracking
  outreach_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  meeting_count INT DEFAULT 0,

  UNIQUE(list_id, account_id)
);

CREATE INDEX idx_list_members_list ON list_members(list_id, position);
CREATE INDEX idx_list_members_account ON list_members(account_id);

-- RLS
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view list members for accessible lists"
  ON list_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists l
      WHERE l.id = list_members.list_id
      AND (
        l.owner_id = auth.uid()
        OR l.is_shared = TRUE
        OR auth.uid() = ANY(l.shared_with_users)
      )
    )
  );

CREATE POLICY "Users can manage list members for their lists"
  ON list_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_members.list_id
      AND lists.owner_id = auth.uid()
    )
  );

-- List Templates (Predefined list configurations)
CREATE TABLE list_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name for UI

  -- Template Configuration
  filter_criteria JSONB NOT NULL,
  is_global BOOLEAN DEFAULT FALSE, -- Available to all workspaces

  -- Usage Stats
  use_count INT DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_list_templates_workspace ON list_templates(workspace_id);
CREATE INDEX idx_list_templates_global ON list_templates(is_global) WHERE is_global = TRUE;

-- List Exports (Track CRM exports)
CREATE TABLE list_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,

  -- Export Details
  export_type VARCHAR(50) NOT NULL, -- 'csv', 'salesforce', 'hubspot'
  export_format VARCHAR(50), -- 'full', 'summary'
  account_count INT,

  -- File/URL
  file_url TEXT, -- For CSV downloads
  external_id VARCHAR(255), -- CRM campaign ID, etc.

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,

  -- Metadata
  exported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_list_exports_list ON list_exports(list_id, created_at DESC);

-- Function to update list account count (trigger on list_members changes)
CREATE OR REPLACE FUNCTION update_list_account_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE lists
    SET account_count = account_count - 1
    WHERE id = OLD.list_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE lists
    SET account_count = account_count + 1
    WHERE id = NEW.list_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_list_count
AFTER INSERT OR DELETE ON list_members
FOR EACH ROW EXECUTE FUNCTION update_list_account_count();
```

---

## 🔌 API Endpoints

### Lists

```
POST   /api/lists
Body: { name, description, listType, filterCriteria?, ownerId? }
Response: { list }

GET    /api/lists
Query: { status?, listType?, ownerId?, shared? }
Response: { lists: [] }

GET    /api/lists/:id
Response: { list, members: [], stats: {...} }

PATCH  /api/lists/:id
Body: { name?, description?, filterCriteria?, status? }
Response: { list }

DELETE /api/lists/:id
Response: { success: true }

POST   /api/lists/:id/clone
Body: { name }
Response: { list }

POST   /api/lists/:id/refresh
Response: { list, addedCount, removedCount }
```

### List Members

```
POST   /api/lists/:id/members
Body: { accountIds: [...] }
Response: { addedCount }

DELETE /api/lists/:id/members
Body: { accountIds: [...] }
Response: { removedCount }

GET    /api/lists/:id/members
Query: { page?, limit?, sortBy?, sortOrder? }
Response: { members: [], pagination }

POST   /api/lists/:id/members/reorder
Body: { accountId, newPosition }
Response: { success: true }
```

### Bulk Operations

```
POST   /api/lists/:id/bulk-tag
Body: { accountIds: [...], tags: [...] }
Response: { job_id }

POST   /api/lists/:id/bulk-assign
Body: { accountIds: [...], ownerId }
Response: { job_id }

POST   /api/lists/:id/bulk-add-to-sequence
Body: { accountIds: [...], sequenceId }
Response: { job_id }

POST   /api/lists/:id/export
Body: { exportType: 'csv' | 'salesforce' | 'hubspot', format? }
Response: { export_id, downloadUrl? }

GET    /api/lists/:id/exports
Response: { exports: [] }
```

### List Templates

```
GET    /api/list-templates
Response: { templates: [] }

POST   /api/lists/from-template/:templateId
Body: { name, customizations? }
Response: { list }
```

---

## 🎨 UI/UX Screens

### 1. Lists Overview Page

**Header:**
- "Target Lists" title
- Tabs: My Lists, Shared With Me, Archived
- Actions: "Create List" button, "Import List" button

**Lists Grid/Table View:**
- Toggle: Grid view / Table view
- Filters: Status, Type (Smart/Static), Owner, Tags
- Sort: Name, Created date, Account count, Performance

**Per List Card (Grid View):**
- List name with color indicator
- Account count badge
- Owner avatar
- Type icon (⚡ for smart lists)
- Tags
- Performance metrics: Reply rate, Meeting rate
- Actions dropdown: Edit, Clone, Export, Archive, Delete

**Table View Columns:**
- Name, Type, Owner, Account Count, Reply Rate, Meeting Rate, Created, Actions

---

### 2. Create List Modal

**Step 1: List Type**
- Radio options:
  - 📋 Static List (manual curation)
  - ⚡ Smart List (auto-updating)
  - 📥 Import from CSV

**Step 2: List Details**
- Input: List name (required)
- Textarea: Description
- Color picker: List color
- Tag input: Add tags

**Step 3: Criteria (Smart List only)**
- Filter builder:
  - Industry: Multi-select
  - Employee range: Dropdown
  - Revenue range: Min/Max
  - Fit score: Min slider
  - Intent score: Min slider
  - Engagement score: Min slider
  - Tags: Multi-select
  - Custom fields: Dynamic filters

- Preview count: "142 accounts match criteria"
- Auto-refresh: Toggle + frequency dropdown

**Step 4: Import (Import type only)**
- File upload
- Column mapping
- Duplicate handling

**Footer:**
- "Cancel" button
- "Create List" button

---

### 3. List Detail Page

**Header:**
- List name (editable inline)
- Type badge (Smart/Static)
- Account count
- Actions: Add Accounts, Bulk Actions, Export, Settings

**Metrics Bar:**
- Total Accounts: 142
- Contacted: 98 (69%)
- Replied: 23 (23% of contacted)
- Meetings: 12 (12%)

**Filters & Search:**
- Search box: "Search accounts..."
- Filters: Score range, Tags, Owner, Status
- Sort: Name, Score, Last activity

**Accounts Table:**
- Checkbox column (multi-select)
- Name + Domain
- Fit/Intent/Engagement scores (color-coded)
- Owner
- Tags
- Last activity
- Actions: View, Remove from list

**Bulk Actions Bar (appears on selection):**
- "X accounts selected"
- Actions: Tag, Assign Owner, Add to Sequence, Remove from List, Export
- Cancel selection

**Smart List Criteria Panel (collapsible):**
- Shows filter criteria
- Last refreshed: 2 hours ago
- Refresh now button
- Edit criteria button

---

### 4. Bulk Action Modals

**Bulk Tag Modal:**
- Multi-select: Existing tags + create new
- "Apply to X accounts"
- Confirm button

**Bulk Assign Modal:**
- Dropdown: Select team member
- Checkbox: "Send notification email"
- "Assign to X accounts"

**Bulk Add to Sequence Modal:**
- Dropdown: Select sequence
- Preview: Sequence steps
- Schedule: Start immediately / Schedule for date
- "Add X accounts to sequence"

**Export Modal:**
- Radio options:
  - 📄 CSV Export
  - 🔵 Salesforce Campaign
  - 🟠 HubSpot List
- Export format: Full data / Summary
- Fields to include: Checkboxes
- "Export X accounts"

---

### 5. List Templates Gallery

**Header:** "Start with a template"

**Template Cards:**
- Enterprise Accounts (500+ employees)
- High Intent Accounts (Intent score > 70)
- New Tech Startups (Founded in last 2 years)
- Geographic Focus (specific region)
- Industry-Specific (Fintech, Healthcare, etc.)

**Per Template Card:**
- Icon
- Name
- Description
- "Preview criteria" link
- "Use template" button
- Usage count: "Used 45 times"

---

## 🔐 Security & Performance

### Performance Optimization

**Smart List Refresh:**
```typescript
async function refreshSmartList(listId: string) {
  const list = await getList(listId)

  // Build query from filter criteria
  const query = buildQueryFromCriteria(list.filter_criteria)

  // Get current members
  const currentMembers = await getListMembers(listId)

  // Get accounts matching criteria
  const matchingAccounts = await query.execute()

  // Calculate diff
  const toAdd = matchingAccounts.filter(a => !currentMembers.includes(a.id))
  const toRemove = currentMembers.filter(m => !matchingAccounts.find(a => a.id === m.account_id))

  // Update in transaction
  await db.transaction(async (trx) => {
    if (toRemove.length > 0) {
      await trx('list_members')
        .whereIn('account_id', toRemove.map(m => m.account_id))
        .where('list_id', listId)
        .delete()
    }

    if (toAdd.length > 0) {
      await trx('list_members').insert(
        toAdd.map(a => ({ list_id: listId, account_id: a.id }))
      )
    }

    await trx('lists')
      .where('id', listId)
      .update({ last_refreshed_at: new Date() })
  })

  return { addedCount: toAdd.length, removedCount: toRemove.length }
}
```

**Bulk Operations with Background Jobs:**
- Operations >100 accounts run in background (F044)
- Progress updates via WebSocket
- Rollback on errors

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  List CRUD operations
- [ ]  Smart list criteria parsing
- [ ]  Bulk tag operation
- [ ]  Bulk assign operation
- [ ]  Export generation

### Integration Tests

- [ ]  Create smart list with 1000 accounts
- [ ]  Refresh smart list (add/remove members)
- [ ]  Bulk tag 500 accounts
- [ ]  Export to Salesforce
- [ ]  Clone list with all members

### Performance Tests

- [ ]  Load list with 5000 accounts <1s
- [ ]  Bulk operation on 1000 accounts <10s
- [ ]  Smart list refresh <5s
- [ ]  Export 1000 accounts <30s

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "zod": "^3.22.4",
    "react-dnd": "^16.0.1",
    "papaparse": "^5.4.1"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: Core List Management

**Days 1-2:**
- [ ]  Database schema
- [ ]  List CRUD API
- [ ]  List overview UI

**Days 3-4:**
- [ ]  List members management
- [ ]  Add/remove accounts
- [ ]  List detail page

**Day 5:**
- [ ]  Smart list criteria builder
- [ ]  Auto-refresh logic
- [ ]  Testing

### Week 2: Bulk Operations & Export

**Days 1-2:**
- [ ]  Bulk tag/assign operations
- [ ]  Background job integration
- [ ]  Progress indicators

**Days 3-4:**
- [ ]  CSV export
- [ ]  Salesforce/HubSpot export
- [ ]  Export tracking

**Day 5:**
- [ ]  List templates
- [ ]  Performance optimization
- [ ]  End-to-end testing

---

## 🎯 Definition of Done

- [ ]  Auto-generate lists by segment working
- [ ]  Manual CRUD operations functional
- [ ]  Bulk tag/assign working (1000+ accounts)
- [ ]  Export to CRM functional
- [ ]  Smart lists auto-updating
- [ ]  Performance benchmarks met
- [ ]  Tests passing
- [ ]  Documentation complete

---

## 🔮 Future Enhancements

1. **List Recommendations**: AI-powered list suggestions
2. **A/B Testing**: Split lists for campaign testing
3. **List Scoring**: Quality score for lists
4. **Collaborative Lists**: Multi-user editing
5. **List Analytics**: Conversion funnel per list
6. **Dynamic Lists**: Real-time updates on criteria match
7. **List Merge**: Combine multiple lists with deduplication
8. **Account Suggestions**: Recommend accounts to add based on list
9. **List Health Score**: Engagement and data quality metrics
10. **Scheduled Exports**: Auto-export to CRM on schedule

---

## 📚 Resources

- [List Segmentation Best Practices](https://www.gong.io/blog/account-based-sales/)
- [Smart Lists UX Patterns](https://mailchimp.com/help/create-and-send-to-a-segment/)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
