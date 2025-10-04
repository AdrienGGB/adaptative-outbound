# F026: Performance Analytics & Reporting

## 📋 Overview

**Feature ID:** F026
**Priority:** P1 - Core Feature
**Timeline:** Week 21-22 (Sprint 6)
**Dependencies:** F002 (Database), F023 (Sequence Executor)
**Status:** Ready for Development

---

## 🎯 Goals

Build comprehensive analytics that:

1. Shows dashboard with open/reply/meeting rates
2. Provides funnel visualization from outreach to meeting
3. Displays rep leaderboard for team performance
4. Refreshes data with <5 min lag
5. Enables custom date range filtering
6. Exports reports to CSV/PDF

---

## 👥 User Stories

### Performance Dashboard

1. **As an SDR**, I want to see my performance metrics so I know how I'm doing
2. **As a manager**, I want team-wide analytics so I can track overall progress
3. **As a user**, I want real-time updates so data is always current
4. **As an exec**, I want high-level KPIs so I can report to leadership

### Funnel Analytics

1. **As a manager**, I want to see conversion funnel so I identify drop-off points
2. **As an SDR**, I want to know my email → reply → meeting conversion so I optimize
3. **As a user**, I want to compare time periods so I track improvement
4. **As a manager**, I want to segment by sequence so I know what works

### Rep Performance

1. **As a manager**, I want rep leaderboard so I can recognize top performers
2. **As an SDR**, I want to see my rank so I know where I stand
3. **As a manager**, I want coaching insights so I help struggling reps
4. **As a user**, I want activity vs results view so I balance quality and quantity

### Reporting

1. **As a manager**, I want to export reports so I can share with leadership
2. **As a user**, I want scheduled reports via email so I get regular updates
3. **As an exec**, I want executive summary so I get the highlights
4. **As a user**, I want custom dashboards so I track what matters to me

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Dashboard shows open/reply/meeting rates
- [ ]  Funnel visualization working
- [ ]  Rep leaderboard functional
- [ ]  Data refreshes with <5 min lag
- [ ]  Date range filtering working
- [ ]  CSV/PDF export functional
- [ ]  Drill-down to detail views

### Performance Requirements

- [ ]  Dashboard load: <2 seconds
- [ ]  Query performance: <1 second for aggregations
- [ ]  Real-time updates: <5 min lag
- [ ]  Support 100K+ activities in analysis

### UX Requirements

- [ ]  Interactive charts (hover, click)
- [ ]  Responsive design (mobile-friendly)
- [ ]  Comparison views (vs last period)
- [ ]  Trend indicators (↑↓)

---

## 🏗️ Technical Architecture

### Analytics Materialized Views

```sql
-- Daily Activity Summary (for fast queries)
CREATE MATERIALIZED VIEW daily_activity_summary AS
SELECT
  workspace_id,
  user_id,
  DATE(created_at) as activity_date,

  -- Counts by type
  COUNT(*) FILTER (WHERE activity_type = 'email_sent') as emails_sent,
  COUNT(*) FILTER (WHERE activity_type = 'email_opened') as emails_opened,
  COUNT(*) FILTER (WHERE activity_type = 'email_clicked') as emails_clicked,
  COUNT(*) FILTER (WHERE activity_type = 'email_replied') as emails_replied,
  COUNT(*) FILTER (WHERE activity_type = 'call_completed') as calls_completed,
  COUNT(*) FILTER (WHERE activity_type = 'meeting_held') as meetings_held,

  -- Unique accounts/contacts touched
  COUNT(DISTINCT account_id) as accounts_touched,
  COUNT(DISTINCT contact_id) as contacts_touched

FROM activities
GROUP BY workspace_id, user_id, DATE(created_at);

CREATE UNIQUE INDEX idx_daily_summary ON daily_activity_summary(workspace_id, user_id, activity_date);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (using pg_cron or external scheduler)
-- SELECT cron.schedule('refresh-analytics', '0 1 * * *', 'SELECT refresh_daily_summary()');

-- Sequence Performance Summary
CREATE MATERIALIZED VIEW sequence_performance_summary AS
SELECT
  s.id as sequence_id,
  s.workspace_id,
  s.name as sequence_name,

  COUNT(DISTINCT se.id) as total_enrollments,
  COUNT(DISTINCT se.id) FILTER (WHERE se.status = 'completed') as completed,
  COUNT(DISTINCT se.id) FILTER (WHERE se.replied = true) as replied,
  COUNT(DISTINCT se.id) FILTER (WHERE se.meeting_booked = true) as meetings_booked,

  -- Conversion rates
  ROUND(
    100.0 * COUNT(DISTINCT se.id) FILTER (WHERE se.replied = true) / NULLIF(COUNT(DISTINCT se.id), 0),
    2
  ) as reply_rate,

  ROUND(
    100.0 * COUNT(DISTINCT se.id) FILTER (WHERE se.meeting_booked = true) / NULLIF(COUNT(DISTINCT se.id), 0),
    2
  ) as meeting_rate,

  -- Avg steps completed
  ROUND(AVG(se.steps_completed), 1) as avg_steps_completed

FROM sequences s
LEFT JOIN sequence_enrollments se ON se.sequence_id = s.id
WHERE s.status != 'draft'
GROUP BY s.id, s.workspace_id, s.name;

CREATE UNIQUE INDEX idx_sequence_summary ON sequence_performance_summary(sequence_id);

-- User Performance Leaderboard
CREATE MATERIALIZED VIEW user_performance_leaderboard AS
SELECT
  wm.workspace_id,
  wm.user_id,
  u.email,
  p.first_name,
  p.last_name,

  -- Activity counts (last 30 days)
  SUM(das.emails_sent) as emails_sent_30d,
  SUM(das.emails_opened) as emails_opened_30d,
  SUM(das.emails_replied) as emails_replied_30d,
  SUM(das.meetings_held) as meetings_held_30d,

  -- Conversion rates
  ROUND(
    100.0 * SUM(das.emails_opened) / NULLIF(SUM(das.emails_sent), 0),
    2
  ) as open_rate_30d,

  ROUND(
    100.0 * SUM(das.emails_replied) / NULLIF(SUM(das.emails_sent), 0),
    2
  ) as reply_rate_30d,

  -- Score for ranking
  (
    SUM(das.meetings_held) * 10 +
    SUM(das.emails_replied) * 5 +
    SUM(das.emails_sent) * 1
  ) as performance_score

FROM workspace_members wm
JOIN auth.users u ON u.id = wm.user_id
LEFT JOIN profiles p ON p.id = wm.user_id
LEFT JOIN daily_activity_summary das ON das.user_id = wm.user_id
  AND das.activity_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wm.workspace_id, wm.user_id, u.email, p.first_name, p.last_name;

CREATE UNIQUE INDEX idx_leaderboard ON user_performance_leaderboard(workspace_id, user_id);
```

### Real-Time Analytics Query Functions

```sql
-- Function to get funnel metrics
CREATE OR REPLACE FUNCTION get_funnel_metrics(
  p_workspace_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_clicked BIGINT,
  emails_replied BIGINT,
  meetings_booked BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  reply_rate NUMERIC,
  meeting_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH email_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE activity_type = 'email_sent') as sent,
      COUNT(*) FILTER (WHERE activity_type = 'email_opened') as opened,
      COUNT(*) FILTER (WHERE activity_type = 'email_clicked') as clicked,
      COUNT(*) FILTER (WHERE activity_type = 'email_replied') as replied,
      COUNT(*) FILTER (WHERE activity_type = 'meeting_held') as meetings
    FROM activities
    WHERE workspace_id = p_workspace_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
      AND (p_user_id IS NULL OR user_id = p_user_id)
  )
  SELECT
    sent,
    opened,
    clicked,
    replied,
    meetings,
    ROUND(100.0 * opened / NULLIF(sent, 0), 2),
    ROUND(100.0 * clicked / NULLIF(opened, 0), 2),
    ROUND(100.0 * replied / NULLIF(sent, 0), 2),
    ROUND(100.0 * meetings / NULLIF(replied, 0), 2)
  FROM email_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔌 API Endpoints

```
GET    /api/analytics/dashboard
Query: { startDate?, endDate?, userId? }
Response: {
  overview: { emailsSent, opened, replied, meetings },
  rates: { openRate, replyRate, meetingRate },
  trends: { ... },
  topSequences: []
}

GET    /api/analytics/funnel
Query: { startDate?, endDate?, segmentBy? }
Response: {
  funnel: [
    { stage: 'sent', count: 1000, conversion: 100 },
    { stage: 'opened', count: 300, conversion: 30 },
    { stage: 'replied', count: 50, conversion: 5 },
    { stage: 'meeting', count: 20, conversion: 2 }
  ]
}

GET    /api/analytics/leaderboard
Query: { metric?, period? }
Response: {
  leaderboard: [
    { userId, name, emailsSent, replyRate, meetings, rank }
  ]
}

GET    /api/analytics/sequences
Query: { sequenceId?, startDate?, endDate? }
Response: {
  sequences: [
    { id, name, enrollments, replyRate, meetingRate }
  ]
}

GET    /api/analytics/trends
Query: { metric, groupBy, startDate?, endDate? }
Response: {
  data: [
    { date: '2024-01-01', value: 45 },
    { date: '2024-01-02', value: 52 }
  ]
}

POST   /api/analytics/export
Body: { reportType, format: 'csv' | 'pdf', filters }
Response: { downloadUrl, expiresAt }
```

---

## 🎨 UI/UX Screens

### 1. Performance Dashboard

**Header:**
- Date range picker (Last 7 days, 30 days, 90 days, Custom)
- Filter: Team / My Performance
- Export button

**KPI Cards (Top Row):**
- 📧 Emails Sent: 1,234 (↑ 12% vs last period)
- 👁️ Open Rate: 45% (↑ 3%)
- 💬 Reply Rate: 12% (↓ 1%)
- 📅 Meetings Booked: 45 (↑ 25%)

**Charts:**

**Funnel Visualization:**
- Vertical funnel showing:
  - Emails Sent: 1,234 (100%)
  - Opened: 556 (45%)
  - Clicked: 123 (10%)
  - Replied: 148 (12%)
  - Meetings: 45 (3.6%)
- Hover shows absolute numbers and percentages

**Activity Trend (Line Chart):**
- X-axis: Date
- Y-axis: Count
- Lines: Emails Sent, Opened, Replied, Meetings
- Toggle: Show/hide each metric

**Top Sequences Table:**
- Columns: Sequence Name, Enrollments, Reply Rate, Meeting Rate
- Sort by any column
- Click to drill into sequence details

---

### 2. Rep Leaderboard

**Header:** "Team Performance"

**Leaderboard Table:**
- Columns: Rank, Name, Emails Sent, Open Rate, Reply Rate, Meetings, Score
- Highlight current user's row
- Badges for top 3 (🥇🥈🥉)
- Filter: Time period
- Sort: By any metric

**Individual Comparison View:**
- Select rep to compare
- Side-by-side metrics
- Highlight better performer in green

---

### 3. Sequence Analytics

**Sequence Selector:** Dropdown

**Metrics:**
- Total Enrolled: 450
- Completed: 120 (27%)
- Active: 298 (66%)
- Replied: 89 (20%)
- Meetings: 34 (8%)

**Step Performance Breakdown:**
- Table showing each step
- Columns: Step, Type, Sent, Opened, Clicked, Replied, Conversion
- Identifies best/worst performing steps

**Enrollment Timeline:**
- Shows enrollments over time
- Stacked area: Active, Completed, Replied

**A/B Test Results (if applicable):**
- Variant comparison
- Statistical significance indicator
- Winner recommendation

---

### 4. Custom Report Builder

**Step 1: Select Metrics**
- Checkboxes: Emails Sent, Open Rate, Reply Rate, Meetings, etc.

**Step 2: Filters**
- Date range
- Team members
- Sequences
- Account segments

**Step 3: Grouping**
- Group by: Day, Week, Month, User, Sequence

**Step 4: Export**
- Format: CSV, PDF, Excel
- Delivery: Download now, Email, Schedule recurring

**Preview:**
- Shows sample of report
- Estimated rows

---

### 5. Activity Feed (Real-Time)

**Live activity stream:**
- 2 min ago: John Smith opened "Intro Email" for Acme Corp
- 5 min ago: Sarah Jones booked meeting with TechCo
- 8 min ago: Mike Davis replied to "Follow-up #2"

**Filters:**
- Activity type
- Team member
- Auto-refresh toggle

---

## 🔐 Analytics Processing

### Data Refresh Strategy

```typescript
// Incremental updates for recent data
async function refreshRecentAnalytics() {
  const cutoffTime = new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes

  // Update daily summary for today
  await updateDailySummary(new Date())

  // Invalidate cached metrics
  await redis.del('analytics:dashboard:*')
}

// Scheduled job (every 5 minutes)
setInterval(refreshRecentAnalytics, 5 * 60 * 1000)

// Full refresh (nightly)
async function fullRefresh() {
  await supabase.rpc('refresh_daily_summary')
  await supabase.rpc('refresh_sequence_summary')
  await supabase.rpc('refresh_leaderboard')
}

// Schedule at 1 AM daily
cron.schedule('0 1 * * *', fullRefresh)
```

### Caching Strategy

```typescript
// Cache dashboard data for 5 minutes
async function getDashboardData(workspaceId: string, filters: any) {
  const cacheKey = `analytics:dashboard:${workspaceId}:${JSON.stringify(filters)}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Query database
  const data = await queryDashboard(workspaceId, filters)

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data))

  return data
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  Funnel calculation logic
- [ ]  Rate calculations (handle division by zero)
- [ ]  Date range filtering
- [ ]  Ranking algorithm

### Integration Tests

- [ ]  Dashboard data accuracy
- [ ]  Leaderboard rankings correct
- [ ]  Export generation
- [ ]  Real-time updates

### Performance Tests

- [ ]  Dashboard load <2s with 100K activities
- [ ]  Query performance <1s
- [ ]  Materialized view refresh time

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "recharts": "^2.10.0",
    "@tanstack/react-query": "^5.17.0",
    "date-fns": "^3.0.0",
    "papaparse": "^5.4.1"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  Materialized views
- [ ]  Dashboard API
- [ ]  KPI cards UI
- [ ]  Funnel visualization

**Week 2:**
- [ ]  Leaderboard
- [ ]  Sequence analytics
- [ ]  Export functionality
- [ ]  Real-time updates

---

## 🎯 Definition of Done

- [ ]  Dashboard shows open/reply/meeting rates
- [ ]  Funnel visualization working
- [ ]  Rep leaderboard functional
- [ ]  Data refreshes <5 min lag
- [ ]  Tests passing
- [ ]  Documentation complete

---

## 🔮 Future Enhancements

1. **Predictive Analytics**: ML-powered forecasting
2. **Custom Dashboards**: Drag-and-drop widget builder
3. **Benchmarking**: Compare to industry averages
4. **Cohort Analysis**: Track cohort performance over time
5. **Attribution**: Multi-touch attribution modeling
6. **AI Insights**: Automated insights and recommendations
7. **Slack/Teams Integration**: Daily digest in chat
8. **Mobile App**: Native mobile analytics app

---

## 📚 Resources

- [Sales Analytics Best Practices](https://www.gong.io/blog/sales-analytics/)
- [Funnel Optimization](https://www.salesforce.com/resources/articles/sales-funnel/)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
