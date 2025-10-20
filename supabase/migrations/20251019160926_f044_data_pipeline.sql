-- F044: Data Pipeline & Background Job Processing
-- Creates job queue, workspace settings, and rate limiting tables

-- ============================================
-- 1. Workspace API Settings (BYOK - Bring Your Own Key)
-- ============================================

CREATE TABLE workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,

  -- Apollo.io API Configuration (Bring Your Own Key)
  apollo_api_key_encrypted TEXT,
  apollo_auto_enrich BOOLEAN DEFAULT false,

  -- Usage Tracking
  enrichment_credits_used INT DEFAULT 0,
  last_enrichment_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspace_settings_workspace ON workspace_settings(workspace_id);

-- RLS Policies
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settings in their workspace"
  ON workspace_settings FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage settings"
  ON workspace_settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 2. Job Queue System
-- ============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Job Classification
  job_type VARCHAR(100) NOT NULL,
  job_queue VARCHAR(50) DEFAULT 'default',

  -- Payload
  payload JSONB NOT NULL,

  -- Status & Execution
  status VARCHAR(20) DEFAULT 'pending',
  priority INT DEFAULT 0,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,

  -- Progress Tracking
  progress JSONB DEFAULT '{}',

  -- Results
  result JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Retry Logic
  next_retry_at TIMESTAMP,
  retry_delay_seconds INT DEFAULT 60,

  -- Worker Info
  worker_id VARCHAR(100),
  worker_heartbeat_at TIMESTAMP,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CHECK(attempts <= max_attempts),
  CHECK(priority >= 0 AND priority <= 10)
);

-- Indexes
CREATE INDEX idx_jobs_workspace ON jobs(workspace_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_jobs_queue_priority ON jobs(job_queue, priority DESC, created_at ASC) WHERE status = 'pending';
CREATE INDEX idx_jobs_type ON jobs(job_type);

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their workspace"
  ON jobs FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create jobs in their workspace"
  ON jobs FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "System can update job status"
  ON jobs FOR UPDATE USING (true);

-- ============================================
-- 3. Job Audit Logs
-- ============================================

CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_logs_job ON job_logs(job_id, created_at DESC);

ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for accessible jobs"
  ON job_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN workspace_members wm ON wm.workspace_id = jobs.workspace_id
      WHERE jobs.id = job_logs.job_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
