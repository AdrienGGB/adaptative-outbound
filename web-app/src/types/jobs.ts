// F044: Job Queue TypeScript Types

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'dead_letter';

export type JobType =
  | 'import_csv'
  | 'export_csv'
  | 'enrich_account'
  | 'enrich_contact'
  | 'sync_crm'
  | 'send_email_batch'
  | 'generate_report'
  | 'cleanup_data'
  | 'test_job'
  | 'test_slow_job'
  | 'test_failing_job';

export type JobQueue = 'default' | 'high_priority' | 'low_priority' | 'scheduled';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface JobProgress {
  total?: number;
  processed?: number;
  failed?: number;
  percentage?: number;
  message?: string;
}

export interface Job {
  id: string;
  workspace_id: string;
  job_type: JobType;
  job_queue: JobQueue;
  payload: Record<string, any>;
  status: JobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  progress: JobProgress;
  result?: Record<string, any>;
  error_message?: string;
  error_stack?: string;
  created_at: string;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  next_retry_at?: string;
  retry_delay_seconds?: number;
  worker_id?: string;
  worker_heartbeat_at?: string;
  created_by?: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  log_level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateJobRequest {
  job_type: JobType;
  payload: Record<string, any>;
  priority?: number;
  scheduled_for?: string;
  job_queue?: JobQueue;
}

export interface JobFilters {
  status?: JobStatus | JobStatus[];
  job_type?: JobType | JobType[];
  created_after?: string;
  created_before?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'started_at' | 'completed_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}

export interface JobStats {
  queue_depth: number;
  processing: number;
  completed_last_hour: number;
  failed_last_hour: number;
  average_duration_ms: number;
  throughput_per_minute: number;
}

export interface JobQueueHealth {
  queue: string;
  depth: number;
  processing: number;
  oldest_pending_seconds?: number;
}

export interface JobDashboardData {
  stats: JobStats;
  queues: JobQueueHealth[];
  recent_failures: Job[];
  recent_completions: Job[];
}

export interface PaginatedJobs {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Job type-specific payload interfaces
export interface ImportCsvPayload {
  file_url: string;
  entity_type: 'accounts' | 'contacts';
  mapping: Record<string, string>;
  options?: {
    update_existing?: boolean;
    skip_duplicates?: boolean;
    batch_size?: number;
  };
}

export interface EnrichAccountPayload {
  account_id: string;
  enrich_fields?: string[];
}

export interface EnrichContactPayload {
  contact_id: string;
  enrich_fields?: string[];
}

export interface ExportCsvPayload {
  entity_type: 'accounts' | 'contacts' | 'activities';
  filters?: Record<string, any>;
  fields?: string[];
  format?: 'csv' | 'excel';
}

// Helper type guards
export function isJobPending(job: Job): boolean {
  return job.status === 'pending';
}

export function isJobProcessing(job: Job): boolean {
  return job.status === 'processing';
}

export function isJobCompleted(job: Job): boolean {
  return job.status === 'completed';
}

export function isJobFailed(job: Job): boolean {
  return job.status === 'failed' || job.status === 'dead_letter';
}

export function canRetryJob(job: Job): boolean {
  return job.status === 'failed' && job.attempts < job.max_attempts;
}

export function canCancelJob(job: Job): boolean {
  return job.status === 'pending' || job.status === 'processing';
}

// Status display helpers
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  dead_letter: 'Dead Letter',
};

export const JOB_STATUS_COLORS: Record<JobStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  processing: 'default',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
  dead_letter: 'destructive',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  import_csv: 'CSV Import',
  export_csv: 'CSV Export',
  enrich_account: 'Enrich Account',
  enrich_contact: 'Enrich Contact',
  sync_crm: 'CRM Sync',
  send_email_batch: 'Email Batch',
  generate_report: 'Generate Report',
  cleanup_data: 'Data Cleanup',
  test_job: 'Test Job',
  test_slow_job: 'Test Slow Job',
  test_failing_job: 'Test Failing Job',
};
