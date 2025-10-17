# F007: Account Scoring & Prioritization

## 📋 Overview

**Feature ID:** F007
**Priority:** P1 - Core Feature
**Timeline:** Week 9-10 (Sprint 3)
**Dependencies:** F001 (Data Integration), F002 (Database)
**Status:** Ready for Development

---

## 🎯 Goals

Build an intelligent scoring system that:

1. Scores accounts by fit (firmographic match to ICP)
2. Scores accounts by intent (buying signals and engagement)
3. Scores accounts by engagement (interaction history)
4. Combines scores into composite prioritization score
5. Updates scores in real-time as data changes
6. Implements score decay for stale accounts

---

## 👥 User Stories

### Fit Scoring

1. **As a sales ops**, I want to define our ICP so accounts are scored by fit
2. **As an SDR**, I want to see which accounts match our ICP so I prioritize effectively
3. **As a manager**, I want fit score based on firmographics so we target the right companies
4. **As a system**, I want to score new accounts automatically on creation

### Intent Scoring

1. **As an SDR**, I want to see which accounts show buying intent so I reach out at the right time
2. **As a system**, I want to track intent signals (website visits, content downloads, job postings)
3. **As a manager**, I want intent score to incorporate 3+ signals so it's accurate
4. **As a user**, I want to see which signals triggered the intent score so I can personalize outreach

### Engagement Scoring

1. **As an SDR**, I want to see account engagement level so I know who's responsive
2. **As a system**, I want to track email opens, replies, meetings so engagement is measured
3. **As a manager**, I want engagement score to decay over time so stale accounts are deprioritized
4. **As a user**, I want to see engagement trend (increasing, stable, decreasing)

### Composite Scoring

1. **As an SDR**, I want a single priority score so I know which accounts to work first
2. **As a manager**, I want to customize score weighting so it matches our sales motion
3. **As a system**, I want scores to update in real-time so prioritization is always current
4. **As a user**, I want to filter/sort by score so I can build targeted lists

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Fit score algorithm validated with sales team
- [ ]  Intent score incorporates 3+ signals (website, content, job postings)
- [ ]  Engagement score tracks email/call/meeting activity
- [ ]  Composite score updating in real-time
- [ ]  Score decay logic working (14-day half-life for engagement)
- [ ]  ICP configuration UI functional
- [ ]  Score explanation tooltips implemented
- [ ]  Score history tracking operational

### Performance Requirements

- [ ]  Score calculation: <100ms per account
- [ ]  Bulk re-scoring: 10,000 accounts in <5 minutes
- [ ]  Real-time score updates: <2 seconds after event
- [ ]  Score query performance: <200ms with 100K accounts

### Accuracy Requirements

- [ ]  Fit score validated against manual scoring (90%+ agreement)
- [ ]  Intent score tested with known buying accounts (precision >80%)
- [ ]  Engagement score correlates with meeting booking rate
- [ ]  Score distribution: Normal curve (most accounts 40-60 range)

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- ICP Configuration
CREATE TABLE icp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- ICP Criteria
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Firmographic Filters (ideal ranges/values)
  employee_count_min INT,
  employee_count_max INT,
  revenue_min BIGINT,
  revenue_max BIGINT,
  industries TEXT[], -- Preferred industries
  geo_regions TEXT[], -- Preferred countries/regions
  company_types TEXT[], -- 'Public', 'Private', etc.

  -- Technology Signals
  required_technologies JSONB, -- Must have these
  -- {"crm": ["Salesforce", "HubSpot"], "analytics": ["Google Analytics"]}

  bonus_technologies JSONB, -- Nice to have

  -- Scoring Weights (0-100, must sum to 100)
  fit_weight INT DEFAULT 40,
  intent_weight INT DEFAULT 30,
  engagement_weight INT DEFAULT 30,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK(fit_weight + intent_weight + engagement_weight = 100)
);

CREATE INDEX idx_icp_configs_workspace ON icp_configs(workspace_id);

-- RLS
ALTER TABLE icp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ICP configs"
  ON icp_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = icp_configs.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- Account Scores
CREATE TABLE account_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  icp_config_id UUID REFERENCES icp_configs(id) ON DELETE SET NULL,

  -- Individual Scores (0-100)
  fit_score DECIMAL(5,2) DEFAULT 0,
  intent_score DECIMAL(5,2) DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Composite Score (weighted average)
  composite_score DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN icp_config_id IS NOT NULL THEN
        (fit_score * 0.4 + intent_score * 0.3 + engagement_score * 0.3)
      ELSE
        (fit_score * 0.4 + intent_score * 0.3 + engagement_score * 0.3)
    END
  ) STORED,

  -- Score Breakdown (for transparency)
  fit_breakdown JSONB,
  -- {
  --   "employee_match": 10,
  --   "revenue_match": 8,
  --   "industry_match": 10,
  --   "geo_match": 5,
  --   "tech_stack_match": 7
  -- }

  intent_breakdown JSONB,
  -- {
  --   "website_visits": 8,
  --   "content_downloads": 5,
  --   "job_postings": 7,
  --   "tech_changes": 3
  -- }

  engagement_breakdown JSONB,
  -- {
  --   "email_opens": 6,
  --   "email_replies": 10,
  --   "meetings_held": 10,
  --   "calls_completed": 5
  --   "recency_factor": 0.8
  -- }

  -- Metadata
  last_scored_at TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1, -- Increment when rescoring

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(account_id),
  CHECK(fit_score >= 0 AND fit_score <= 100),
  CHECK(intent_score >= 0 AND intent_score <= 100),
  CHECK(engagement_score >= 0 AND engagement_score <= 100)
);

CREATE INDEX idx_account_scores_account ON account_scores(account_id);
CREATE INDEX idx_account_scores_composite ON account_scores(composite_score DESC);
CREATE INDEX idx_account_scores_fit ON account_scores(fit_score DESC);
CREATE INDEX idx_account_scores_intent ON account_scores(intent_score DESC);
CREATE INDEX idx_account_scores_engagement ON account_scores(engagement_score DESC);

-- RLS
ALTER TABLE account_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for accessible accounts"
  ON account_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts a
      JOIN workspace_members wm ON wm.workspace_id = a.workspace_id
      WHERE a.id = account_scores.account_id
      AND wm.user_id = auth.uid()
    )
  );

-- Intent Signals
CREATE TABLE intent_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Signal Classification
  signal_type VARCHAR(50) NOT NULL,
  -- Types: 'website_visit', 'content_download', 'pricing_page_view',
  --        'job_posting', 'tech_stack_change', 'funding_round',
  --        'leadership_change', 'expansion_news'

  signal_source VARCHAR(50), -- 'clearbit', 'sixth_sense', 'manual', 'website_tracking'

  -- Signal Strength (1-10)
  strength INT NOT NULL CHECK(strength >= 1 AND strength <= 10),

  -- Signal Data
  signal_data JSONB,
  -- {
  --   "page_url": "/pricing",
  --   "visit_duration_seconds": 120,
  --   "pages_viewed": 5
  -- }

  -- Decay
  decays_at TIMESTAMP, -- When signal should no longer count

  -- Metadata
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intent_signals_account ON intent_signals(account_id, occurred_at DESC);
CREATE INDEX idx_intent_signals_type ON intent_signals(signal_type);
CREATE INDEX idx_intent_signals_workspace ON intent_signals(workspace_id);
CREATE INDEX idx_intent_signals_decays ON intent_signals(decays_at) WHERE decays_at IS NOT NULL;

-- RLS
ALTER TABLE intent_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals for accessible accounts"
  ON intent_signals FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Score History (for tracking changes over time)
CREATE TABLE account_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  fit_score DECIMAL(5,2),
  intent_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  composite_score DECIMAL(5,2),

  snapshot_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_score_history_account ON account_score_history(account_id, snapshot_at DESC);

-- Partition by month for better performance
```

### Scoring Algorithms

**1. Fit Score Calculation:**

```typescript
function calculateFitScore(account: Account, icp: ICPConfig): number {
  let score = 0
  let maxScore = 0

  // Employee count match (0-20 points)
  if (icp.employee_count_min && icp.employee_count_max) {
    maxScore += 20
    if (account.employee_count >= icp.employee_count_min &&
        account.employee_count <= icp.employee_count_max) {
      score += 20
    } else {
      // Partial credit for near misses
      const distance = Math.min(
        Math.abs(account.employee_count - icp.employee_count_min),
        Math.abs(account.employee_count - icp.employee_count_max)
      )
      score += Math.max(0, 20 - (distance / 100))
    }
  }

  // Revenue match (0-20 points)
  if (icp.revenue_min && icp.revenue_max) {
    maxScore += 20
    if (account.annual_revenue >= icp.revenue_min &&
        account.annual_revenue <= icp.revenue_max) {
      score += 20
    }
  }

  // Industry match (0-20 points)
  maxScore += 20
  if (icp.industries.includes(account.industry)) {
    score += 20
  }

  // Geography match (0-15 points)
  maxScore += 15
  if (icp.geo_regions.includes(account.headquarters_country)) {
    score += 15
  }

  // Technology stack match (0-25 points)
  maxScore += 25
  const requiredTechScore = calculateTechMatch(
    account.technologies,
    icp.required_technologies
  )
  const bonusTechScore = calculateTechMatch(
    account.technologies,
    icp.bonus_technologies
  ) * 0.5
  score += requiredTechScore * 0.7 + bonusTechScore * 0.3

  // Normalize to 0-100
  return maxScore > 0 ? (score / maxScore) * 100 : 0
}
```

**2. Intent Score Calculation:**

```typescript
function calculateIntentScore(accountId: string): number {
  const signals = getIntentSignals(accountId, last30Days)

  let score = 0
  const now = Date.now()

  signals.forEach(signal => {
    // Apply time decay (exponential)
    const ageInDays = (now - signal.occurred_at) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-ageInDays / 14) // 14-day half-life

    // Weight by signal strength (1-10)
    const weightedStrength = signal.strength * decayFactor

    score += weightedStrength
  })

  // Normalize to 0-100 (cap at 100)
  return Math.min(score * 5, 100) // Rough normalization
}
```

**3. Engagement Score Calculation:**

```typescript
function calculateEngagementScore(accountId: string): number {
  const activities = getActivities(accountId, last90Days)

  let score = 0
  const weights = {
    email_sent: 1,
    email_opened: 2,
    email_replied: 10,
    call_completed: 8,
    meeting_held: 15,
    demo_completed: 20
  }

  const now = Date.now()

  activities.forEach(activity => {
    const weight = weights[activity.type] || 1

    // Apply time decay
    const ageInDays = (now - activity.occurred_at) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-ageInDays / 14)

    score += weight * decayFactor
  })

  // Normalize to 0-100
  return Math.min(score * 2, 100)
}
```

---

## 🔌 API Endpoints

```
POST   /api/icp
Body: { name, criteria, weights }
Response: { icp }

GET    /api/icp
Response: { icps: [] }

PATCH  /api/icp/:id
Body: { criteria?, weights? }
Response: { icp }

POST   /api/accounts/:id/score
Response: { scores }

POST   /api/accounts/score-bulk
Body: { accountIds: [...] }
Response: { job_id }

GET    /api/accounts/:id/score
Response: { fitScore, intentScore, engagementScore, compositeScore, breakdown }

GET    /api/accounts/:id/score/history
Query: { startDate?, endDate? }
Response: { history: [] }

POST   /api/intent-signals
Body: { accountId, signalType, strength, data }
Response: { signal }

GET    /api/intent-signals
Query: { accountId?, signalType?, startDate? }
Response: { signals: [] }
```

---

## 🎨 UI/UX Screens

### 1. ICP Configuration (Admin)

**Header:** "Ideal Customer Profile"

**Firmographic Criteria:**
- Employee count range: Min/Max inputs
- Revenue range: Min/Max inputs
- Industries: Multi-select dropdown
- Geographic regions: Multi-select
- Company types: Checkboxes

**Technology Stack:**
- Required technologies: Tag input
- Bonus technologies: Tag input

**Score Weighting:**
- Fit weight: Slider (0-100)
- Intent weight: Slider (0-100)
- Engagement weight: Slider (0-100)
- Total must = 100 (validation)

**Button:** "Save ICP Configuration"

---

### 2. Account Detail - Scoring Tab

**Score Overview Card:**
- Composite Score: Large number with color (red <40, yellow 40-70, green 70+)
- Trend indicator: ↑ +5 (last 7 days)

**Individual Scores:**
- Fit Score: 75/100 with breakdown tooltip
- Intent Score: 60/100 with breakdown tooltip
- Engagement Score: 45/100 with breakdown tooltip

**Fit Score Breakdown (Tooltip):**
- Employee count: ✓ 10/10
- Revenue: ✓ 10/10
- Industry: ✓ 20/20
- Geography: ✓ 15/15
- Tech stack: ~ 20/25

**Intent Signals Table:**
- Columns: Signal Type, Strength, Date, Source
- Rows show recent signals

**Engagement Timeline:**
- Visual timeline of activities
- Color-coded by type

**Score History Chart:**
- Line graph showing all scores over time
- Toggle: 7d, 30d, 90d, All time

---

## 🧪 Testing Strategy

### Validation Tests

- [ ]  Fit score matches manual scoring (90%+ agreement)
- [ ]  Intent signals correctly weighted
- [ ]  Engagement decay working (scores decrease over time)
- [ ]  Composite score calculation correct

### Performance Tests

- [ ]  Score 10,000 accounts in <5 minutes
- [ ]  Real-time updates <2 seconds
- [ ]  Score query <200ms

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4",
    "date-fns": "^3.0.0"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  Database schema
- [ ]  Fit score algorithm
- [ ]  ICP configuration UI

**Week 2:**
- [ ]  Intent & engagement scoring
- [ ]  Real-time score updates
- [ ]  Score visualization

---

## 🎯 Definition of Done

- [ ]  All scoring algorithms validated
- [ ]  Real-time updates working
- [ ]  Score decay functional
- [ ]  ICP configuration complete
- [ ]  Tests passing
- [ ]  Documentation complete

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
