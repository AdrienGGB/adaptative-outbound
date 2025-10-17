# F044: Data Pipeline & Background Job Processing

## 📋 Overview

**Feature ID:** F044
**Priority:** P1 - Core Infrastructure
**Timeline:** Week 5-6 (Sprint 2)
**Dependencies:** F004 (Auth), F002 (Database Schema)
**Status:** Ready for Development

---

## 🎯 Goals

Build a robust, scalable data pipeline that:

1. Processes background jobs reliably at 1000+ jobs/minute
2. Handles data transformations (enrichment, imports, exports)
3. Auto-retries failed jobs with exponential backoff
4. Provides real-time monitoring dashboard
5. Guarantees zero data loss with persistent queue
6. Scales horizontally for high-volume workloads

---

## 👥 User Stories

### Job Processing

1. **As a user**, I want CSV imports to process in the background so I don't wait on the page
2. **As an admin**, I want bulk operations to complete without timing out so I can manage large datasets
3. **As a developer**, I want scheduled jobs to run reliably so automations work consistently
4. **As a system**, I want to retry failed jobs automatically so temporary errors don't require manual intervention

### Data Enrichment

1. **As an SDR**, I want accounts auto-enriched with firmographic data so I have context without manual research
2. **As a user**, I want email verification to happen in the background so I know which contacts are valid
3. **As a sales ops**, I want CRM sync to run continuously so data stays fresh
4. **As a system**, I want to rate-limit enrichment API calls so we don't hit quotas

### Monitoring & Reliability

1. **As an admin**, I want to see job queue status so I know if the system is healthy
2. **As a developer**, I want alerts when jobs fail repeatedly so I can investigate issues
3. **As a compliance officer**, I want audit logs of all data transformations so I can prove lineage
4. **As a user**, I want to see progress of long-running jobs so I know when they'll complete

---

## ✅ Success Criteria

### Performance Requirements

- [ ]  Job throughput: 1000+ jobs/minute sustained
- [ ]  Job latency: <5 seconds from enqueue to start (p95)
- [ ]  Queue processing: <100ms overhead per job
- [ ]  Concurrent workers: Scale to 50+ workers
- [ ]  Memory efficient: <500MB per worker process

### Reliability Requirements

- [ ]  Failed job auto-retry with exponential backoff
- [ ]  Dead letter queue for jobs failing >5 times
- [ ]  Zero data loss: Jobs persisted to database before processing
- [ ]  Crash recovery: Resume processing after worker restart
- [ ]  Idempotent jobs: Safe to retry without duplicates

### Monitoring Requirements

- [ ]  Real-time dashboard showing queue depth, throughput, errors
- [ ]  Job history with execution logs
- [ ]  Failed job inspection and manual retry
- [ ]  Performance metrics (p50, p95, p99 latency)
- [ ]  Alerting on critical failures

### Data Integrity Requirements

- [ ]  7-day stress test with zero data loss
- [ ]  Transaction safety for multi-step jobs
- [ ]  Graceful degradation during API outages
- [ ]  Rate limiting respects external API quotas

---

## 🏗️ Technical Architecture

### Job Queue System

**Technology Stack:**
- **Supabase Database**: Job persistence using `pgboss` pattern
- **Supabase Edge Functions**: Job workers (serverless)
- **Alternative**: BullMQ with Redis (if higher throughput needed)

### Database Schema

```sql
-- Job Queue Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Job Classification
  job_type VARCHAR(100) NOT NULL,
  -- Types: 'import_csv', 'export_csv', 'enrich_account', 'enrich_contact',
  --        'sync_crm', 'send_email_batch', 'generate_report', 'cleanup_data'

  job_queue VARCHAR(50) DEFAULT 'default',
  -- Queues: 'default', 'high_priority', 'low_priority', 'scheduled'

  -- Payload
  payload JSONB NOT NULL,
  -- Example: {
  --   "import_type": "csv",
  --   "file_url": "https://...",
  --   "mapping": {...},
  --   "entity_type": "accounts"
  -- }

  -- Status & Execution
  status VARCHAR(20) DEFAULT 'pending',
  -- States: 'pending', 'processing', 'completed', 'failed', 'cancelled', 'dead_letter'

  priority INT DEFAULT 0, -- Higher = more urgent
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,

  -- Progress Tracking
  progress JSONB DEFAULT '{}',
  -- {
  --   "total": 1000,
  --   "processed": 250,
  --   "failed": 5,
  --   "percentage": 25,
  --   "message": "Processing row 250/1000"
  -- }

  -- Results
  result JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP, -- For delayed/scheduled jobs
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Retry Logic
  next_retry_at TIMESTAMP,
  retry_delay_seconds INT DEFAULT 60, -- Exponential backoff

  -- Worker Info
  worker_id VARCHAR(100), -- Which worker is processing
  worker_heartbeat_at TIMESTAMP, -- Last heartbeat (detect stale jobs)

  -- Metadata
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CHECK(attempts <= max_attempts),
  CHECK(priority >= 0 AND priority <= 10)
);

-- Indexes for Performance
CREATE INDEX idx_jobs_workspace ON jobs(workspace_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_jobs_queue_priority ON jobs(job_queue, priority DESC, created_at ASC)
  WHERE status = 'pending';
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_for)
  WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_jobs_retry ON jobs(next_retry_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_created_by ON jobs(created_by, created_at DESC);
CREATE INDEX idx_jobs_stale_check ON jobs(worker_heartbeat_at)
  WHERE status = 'processing';

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their workspace"
  ON jobs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their workspace"
  ON jobs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update job status"
  ON jobs FOR UPDATE
  USING (true); -- Workers need to update status (use service role key)

-- Job Audit Log
CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,

  log_level VARCHAR(20) NOT NULL, -- 'info', 'warn', 'error', 'debug'
  message TEXT NOT NULL,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_logs_job ON job_logs(job_id, created_at DESC);
CREATE INDEX idx_job_logs_level ON job_logs(log_level) WHERE log_level = 'error';

-- RLS for job_logs
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for accessible jobs"
  ON job_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN workspace_members wm ON wm.workspace_id = jobs.workspace_id
      WHERE jobs.id = job_logs.job_id
      AND wm.user_id = auth.uid()
    )
  );
```

### Rate Limiting for Third-Party APIs

```sql
-- Track API rate limits to prevent exceeding quotas
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Rate Limit Key
  key VARCHAR(255) NOT NULL,
  -- Format: "{service}:{workspace_id}" or "{service}:{workspace_id}:{user_id}"
  -- Examples: "clearbit:abc123", "openai:abc123:user456", "salesforce:abc123"

  -- Current Window
  requests INT DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW(),
  window_duration INTERVAL DEFAULT '1 minute',

  -- Limits
  max_requests INT NOT NULL,
  -- Clearbit: 600/min, OpenAI: 500/min, Gmail: 2000/day

  -- Metadata
  last_request_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(key)
);

CREATE INDEX idx_rate_limits_workspace ON rate_limits(workspace_id);
CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_duration);

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rate limits in their workspace"
  ON rate_limits FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key VARCHAR(255),
  p_max_requests INT,
  p_window_duration INTERVAL DEFAULT '1 minute'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_requests INT;
  v_window_start TIMESTAMP;
BEGIN
  -- Get current window
  SELECT requests, window_start
  INTO v_current_requests, v_window_start
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE;

  -- If no record or window expired, reset
  IF NOT FOUND OR (NOW() - v_window_start) > p_window_duration THEN
    INSERT INTO rate_limits (key, requests, window_start, max_requests, window_duration)
    VALUES (p_key, 1, NOW(), p_max_requests, p_window_duration)
    ON CONFLICT (key) DO UPDATE
    SET requests = 1,
        window_start = NOW(),
        max_requests = p_max_requests,
        last_request_at = NOW();
    RETURN TRUE;
  END IF;

  -- Check if under limit
  IF v_current_requests < p_max_requests THEN
    UPDATE rate_limits
    SET requests = requests + 1,
        last_request_at = NOW()
    WHERE key = p_key;
    RETURN TRUE;
  ELSE
    -- Rate limit exceeded
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Job Processing Flow

```
┌─────────────────┐
│   Client App    │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         │ 1. Create Job
         ▼
┌─────────────────────┐
│  API Route/Edge Fn  │
│  POST /api/jobs     │
└────────┬────────────┘
         │
         │ 2. Insert into DB
         ▼
┌─────────────────────┐
│   Jobs Table        │
│ status: 'pending'   │
└────────┬────────────┘
         │
         │ 3. Poll for jobs
         ▼
┌─────────────────────┐
│   Job Worker        │
│ (Edge Function/     │
│  Serverless Worker) │
└────────┬────────────┘
         │
         │ 4. Process
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────┐
│Success │  │Failed  │
└───┬────┘  └───┬────┘
    │           │
    │           │ 5. Retry?
    │           ▼
    │      ┌─────────────┐
    │      │ Retry Logic │
    │      │ (Exponential│
    │      │  Backoff)   │
    │      └─────┬───────┘
    │            │
    │            │ Max attempts?
    │            ▼
    │      ┌──────────────┐
    │      │ Dead Letter  │
    │      │    Queue     │
    │      └──────────────┘
    │
    │ 6. Update Status
    ▼
┌─────────────────────┐
│  Jobs Table         │
│ status: 'completed' │
└─────────────────────┘
```

---

## 📦 Job Types & Handlers

### 1. CSV Import Jobs

**Job Type:** `import_csv`

**Payload:**
```json
{
  "file_url": "https://storage.supabase.co/...",
  "entity_type": "accounts",
  "mapping": {
    "Company Name": "name",
    "Website": "domain",
    "Industry": "industry"
  },
  "options": {
    "update_existing": true,
    "skip_duplicates": false,
    "batch_size": 100
  }
}
```

**Processing Steps:**
1. Download CSV from storage
2. Parse and validate rows
3. Transform data using mapping
4. Batch insert into database (100 rows at a time)
5. Update progress every 100 rows
6. Handle errors gracefully (skip bad rows, log errors)
7. Generate summary report

**Error Handling:**
- Invalid CSV format → Fail immediately
- Duplicate rows → Skip or update based on options
- Validation errors → Log and continue
- Database errors → Retry with backoff

---

### 2. Account Enrichment Jobs

**Job Type:** `enrich_account`

**Payload:**
```json
{
  "account_id": "uuid",
  "enrich_fields": ["employee_count", "revenue", "technologies", "social_links"],
  "provider": "clearbit" // or "zoominfo", "apollo"
}
```

**Processing Steps:**
1. Fetch account from database
2. Call enrichment API (Clearbit, ZoomInfo, Apollo)
3. Parse and validate response
4. Update account record
5. Create version snapshot
6. Log enrichment activity

**Rate Limiting:**
- Implement token bucket algorithm
- Respect API quotas (e.g., 1000 calls/hour)
- Delay jobs if quota exceeded

---

### 3. CRM Sync Jobs

**Job Type:** `sync_crm`

**Payload:**
```json
{
  "crm_provider": "salesforce",
  "sync_direction": "bidirectional", // 'push', 'pull', 'bidirectional'
  "entity_types": ["accounts", "contacts", "opportunities"],
  "last_sync_at": "2024-01-01T00:00:00Z"
}
```

**Processing Steps:**
1. Fetch changed records since `last_sync_at`
2. Transform data to/from CRM format
3. Detect conflicts (same record updated in both systems)
4. Resolve conflicts using strategy (last_write_wins, manual_review)
5. Batch sync records
6. Update `last_sync_at` timestamp

---

### 4. Email Batch Jobs

**Job Type:** `send_email_batch`

**Payload:**
```json
{
  "sequence_id": "uuid",
  "sequence_step_id": "uuid",
  "contact_ids": ["uuid1", "uuid2", "..."],
  "batch_size": 50
}
```

**Processing Steps:**
1. Fetch contacts and email template
2. Personalize emails (merge variables)
3. Send via email provider (SendGrid, AWS SES)
4. Track sending status
5. Log activities
6. Update sequence state

**Rate Limiting:**
- Respect email provider limits (e.g., 50 emails/second)
- Implement gradual warm-up for new domains

---

### 5. Data Export Jobs

**Job Type:** `export_data`

**Payload:**
```json
{
  "entity_type": "accounts",
  "filters": {...},
  "fields": ["name", "domain", "industry"],
  "format": "csv", // or "json", "excel"
  "deliver_to": "email" // or "download_link"
}
```

**Processing Steps:**
1. Query database with filters
2. Stream results to file
3. Generate CSV/Excel file
4. Upload to Supabase Storage
5. Send download link via email or webhook
6. Set expiration (7 days)

---

## 🔌 API Endpoints

### Job Management

```
POST   /api/jobs
Body: { jobType, payload, priority?, scheduledFor? }
Response: { job }

GET    /api/jobs
Query: { status?, jobType?, page?, limit? }
Response: { jobs: [], pagination }

GET    /api/jobs/:id
Response: { job, logs }

PATCH  /api/jobs/:id
Body: { status: 'cancelled' } (admin only)
Response: { job }

POST   /api/jobs/:id/retry
Response: { job }

DELETE /api/jobs/:id (admin only)
Response: { success: true }

GET    /api/jobs/:id/logs
Response: { logs: [] }
```

### Job Statistics & Monitoring

```
GET    /api/jobs/stats
Response: {
  queue_depth: 42,
  processing: 5,
  completed_last_hour: 3240,
  failed_last_hour: 12,
  average_duration_ms: 1250,
  throughput_per_minute: 54
}

GET    /api/jobs/dashboard
Response: {
  queues: {
    default: { depth: 20, processing: 2 },
    high_priority: { depth: 5, processing: 1 }
  },
  recent_failures: [...],
  performance_metrics: {...}
}
```

---

## 🎨 UI/UX Screens

### 1. Job Queue Dashboard (Admin)

**Header:**
- Real-time metrics cards:
  - Queue Depth (pending jobs)
  - Processing (active workers)
  - Throughput (jobs/min)
  - Success Rate (%)

**Main Content:**
- **Queue Health Chart**: Line graph showing queue depth over time
- **Job Types Breakdown**: Pie chart of job distribution
- **Recent Jobs Table**:
  - Columns: Type, Status, Progress, Created, Duration, Actions
  - Filters: Status, Type, Date Range
  - Actions: View Logs, Retry, Cancel

**Sidebar:**
- **Dead Letter Queue**: Count of failed jobs needing attention
- **Alerts**: Recent errors requiring investigation

---

### 2. Job Detail Page

**Header:**
- Job Type, Status badge, Created timestamp
- Actions: Retry (if failed), Cancel (if pending/processing)

**Sections:**
- **Progress**: Progress bar with percentage
- **Payload**: JSON viewer (syntax highlighted)
- **Result**: Success/error details
- **Execution Logs**: Timestamped log entries (info, warn, error)
- **Timeline**: Visual timeline of status changes
- **Retry History**: Attempts, timestamps, outcomes

---

### 3. Import Job Status (User-facing)

**Display:**
- "Your import is processing..."
- Progress bar: "250 / 1000 rows processed (25%)"
- Real-time updates (WebSocket or polling)
- Estimated time remaining

**On Completion:**
- Summary: "Successfully imported 980 accounts, 20 skipped due to errors"
- Download error report (CSV of failed rows)
- View imported records button

---

## 🔐 Security & Reliability

### Job Execution Security

1. **Payload Validation**: Validate all job payloads with Zod schemas
2. **Workspace Isolation**: Jobs can only access data in their workspace
3. **Resource Limits**: Timeout jobs after 15 minutes (configurable per type)
4. **Memory Limits**: Kill jobs exceeding 512MB memory
5. **Rate Limiting**: Per-workspace job creation limits (100/hour for free tier)

### Error Handling Strategy

```typescript
// Exponential backoff calculation
function calculateRetryDelay(attempt: number): number {
  const baseDelay = 60 // 60 seconds
  const maxDelay = 3600 // 1 hour
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  return delay + Math.random() * 30 // Add jitter
}

// Retry logic
if (job.attempts < job.max_attempts) {
  const nextRetry = new Date(Date.now() + calculateRetryDelay(job.attempts) * 1000)
  await updateJob(job.id, {
    status: 'failed',
    attempts: job.attempts + 1,
    next_retry_at: nextRetry,
    error_message: error.message
  })
} else {
  await updateJob(job.id, {
    status: 'dead_letter',
    error_message: 'Max attempts exceeded'
  })
  await alertAdmins(job)
}
```

### Worker Health Monitoring

**Heartbeat System:**
- Workers update `worker_heartbeat_at` every 30 seconds
- Monitor job scans for stale processing jobs (no heartbeat in 5 minutes)
- Automatically reset stale jobs to `pending` status

**Graceful Shutdown:**
- Workers finish current job before terminating
- New jobs not picked up during shutdown
- Maximum shutdown time: 2 minutes

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  Job creation with valid/invalid payloads
- [ ]  Retry logic with exponential backoff
- [ ]  Status transitions (pending → processing → completed)
- [ ]  Progress tracking updates
- [ ]  Error handling for each job type

### Integration Tests

- [ ]  End-to-end CSV import (1000 rows)
- [ ]  Failed job auto-retry flow
- [ ]  Concurrent job processing (10 workers)
- [ ]  Dead letter queue after max attempts
- [ ]  Graceful worker shutdown

### Performance Tests

- [ ]  Sustain 1000 jobs/minute for 1 hour
- [ ]  Queue 10,000 jobs and measure completion time
- [ ]  Memory usage under load (<500MB per worker)
- [ ]  Database query performance (job polling <100ms)

### Reliability Tests

- [ ]  7-day stress test with zero data loss
- [ ]  Worker crash recovery (resume processing)
- [ ]  Database connection loss handling
- [ ]  External API failure graceful degradation

---

## 📦 Dependencies & Libraries

### Backend (Edge Functions / Node.js Workers)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4",
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",
    "pino": "^8.17.2",
    "date-fns": "^3.0.0"
  }
}
```

### Frontend (Dashboard)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "recharts": "^2.10.0",
    "react-json-view": "^1.21.3"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: Core Job Queue

**Days 1-2: Database & Schema**
- [ ]  Create `jobs` and `job_logs` tables
- [ ]  Set up RLS policies
- [ ]  Create database indexes
- [ ]  Write migration scripts

**Days 3-4: Job Worker Foundation**
- [ ]  Build job polling mechanism
- [ ]  Implement job status transitions
- [ ]  Add retry logic with exponential backoff
- [ ]  Create worker heartbeat system
- [ ]  Write job logging utilities

**Day 5: Basic Job Types**
- [ ]  Implement CSV import job handler
- [ ]  Add progress tracking
- [ ]  Test end-to-end with sample data

---

### Week 2: Advanced Features & Monitoring

**Days 1-2: Additional Job Handlers**
- [ ]  Implement account enrichment job
- [ ]  Add CRM sync job (mock for now)
- [ ]  Create export job handler
- [ ]  Implement rate limiting

**Days 3-4: Monitoring Dashboard**
- [ ]  Build job stats API endpoints
- [ ]  Create admin dashboard UI
- [ ]  Add real-time metrics (queue depth, throughput)
- [ ]  Build job detail page with logs

**Day 5: Performance & Testing**
- [ ]  Load testing (1000 jobs/min target)
- [ ]  Optimize database queries
- [ ]  Add dead letter queue handling
- [ ]  Documentation and cleanup

---

## 🎯 Definition of Done

- [ ]  All job types functional and tested
- [ ]  1000+ jobs/minute sustained throughput
- [ ]  Auto-retry with exponential backoff working
- [ ]  Dead letter queue implemented
- [ ]  Monitoring dashboard live with real-time metrics
- [ ]  7-day reliability test passed (zero data loss)
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Performance benchmarks met
- [ ]  Documentation complete
- [ ]  Code reviewed and approved
- [ ]  Deployed to staging
- [ ]  Admin training completed

---

## 🔮 Future Enhancements (Post-MVP)

1. **Scheduled Jobs (Cron)**: Run jobs on schedule (daily, weekly, etc.)
2. **Job Chaining**: Trigger jobs after completion (workflows)
3. **Priority Queues**: Multiple queues with different priorities
4. **Distributed Workers**: Scale workers across multiple machines
5. **Job Dependencies**: Wait for other jobs before starting
6. **Webhook Notifications**: Notify external systems on completion
7. **Custom Retry Strategies**: Per-job-type retry policies
8. **Job Cancellation**: Gracefully cancel running jobs
9. **Performance Analytics**: Detailed job performance insights
10. **Job Scheduling UI**: Visual cron builder

---

## 📚 Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Job Queue Pattern](https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/)
- [Exponential Backoff Best Practices](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Job Queue Architecture Patterns](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

**Product Manager:** ___ **Date:** __
