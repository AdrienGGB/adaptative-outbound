/**
 * Dead Letter Queue Types
 * Manages failed jobs and error tracking
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type DLQStatus = 'pending' | 'investigating' | 'resolved' | 'ignored'

export type DLQJobType =
  | 'email_send'
  | 'crm_sync'
  | 'data_enrichment'
  | 'webhook_delivery'
  | 'report_generation'
  | 'data_import'
  | 'sequence_step'
  | 'activity_tracking'
  | 'notification_send'
  | 'other'

// ============================================================================
// MAIN DLQ INTERFACE
// ============================================================================

export interface DeadLetterQueueEntry {
  id: string
  workspace_id: string | null

  // Original Job Info
  job_id: string | null
  job_type: DLQJobType
  payload: Record<string, any>

  // Failure Info
  error_message: string | null
  stack_trace: string | null
  attempts: number

  // Resolution
  status: DLQStatus
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null

  // Metadata
  failed_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a DLQ entry
 */
export type DeadLetterQueueCreate = Omit<
  DeadLetterQueueEntry,
  'id' | 'failed_at' | 'status' | 'resolved_by' | 'resolved_at' | 'resolution_notes'
> & {
  job_type: DLQJobType
  payload: Record<string, any>
  attempts: number
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a DLQ entry (mainly for resolution)
 */
export type DeadLetterQueueUpdate = Partial<{
  status: DLQStatus
  resolved_by: string
  resolved_at: string
  resolution_notes: string
}>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for querying DLQ entries
 */
export interface DeadLetterQueueFilters {
  workspace_id?: string
  job_type?: DLQJobType | DLQJobType[]
  status?: DLQStatus | DLQStatus[]
  resolved_by?: string

  // Date filters
  failed_after?: string
  failed_before?: string
  resolved_after?: string
  resolved_before?: string

  // Attempt filters
  min_attempts?: number
  max_attempts?: number

  // Search
  search_query?: string // searches error_message

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof DeadLetterQueueEntry
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * DLQ entry with expanded relations
 */
export interface DeadLetterQueueWithRelations extends DeadLetterQueueEntry {
  resolved_by_user?: {
    id: string
    email: string
    full_name: string
  }
}

/**
 * DLQ statistics
 */
export interface DeadLetterQueueStats {
  total_entries: number
  pending_entries: number
  investigating_entries: number
  resolved_entries: number
  ignored_entries: number

  entries_by_job_type: Record<DLQJobType, number>
  entries_last_24_hours: number
  entries_last_7_days: number

  most_common_errors: Array<{
    error_message: string
    count: number
    job_types: DLQJobType[]
  }>

  average_attempts: number
  max_attempts: number

  average_resolution_time_hours: number
  resolution_rate: number // percentage
}

/**
 * DLQ retry payload
 */
export interface DeadLetterQueueRetry {
  entry_id: string
  modify_payload?: Record<string, any> // Optional payload modifications
  max_attempts?: number
}

/**
 * Bulk DLQ resolution
 */
export interface BulkDeadLetterQueueResolve {
  entry_ids: string[]
  status: 'resolved' | 'ignored'
  resolution_notes?: string
}

/**
 * DLQ alert configuration
 */
export interface DeadLetterQueueAlert {
  id: string
  workspace_id: string
  alert_name: string
  job_types: DLQJobType[]
  threshold_count: number // alert if this many failures in time window
  time_window_minutes: number
  notify_users: string[] // user IDs
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * DLQ error pattern
 */
export interface DeadLetterQueueErrorPattern {
  pattern: string
  regex: string | null
  job_types: DLQJobType[]
  count: number
  first_seen: string
  last_seen: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggested_fix?: string
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

export const DLQ_STATUS_LABELS: Record<DLQStatus, string> = {
  pending: 'Pending',
  investigating: 'Investigating',
  resolved: 'Resolved',
  ignored: 'Ignored'
}

export const DLQ_STATUS_COLORS: Record<DLQStatus, string> = {
  pending: '#F97316', // orange
  investigating: '#3B82F6', // blue
  resolved: '#22C55E', // green
  ignored: '#64748B' // slate
}

export const DLQ_JOB_TYPE_LABELS: Record<DLQJobType, string> = {
  email_send: 'Email Send',
  crm_sync: 'CRM Sync',
  data_enrichment: 'Data Enrichment',
  webhook_delivery: 'Webhook Delivery',
  report_generation: 'Report Generation',
  data_import: 'Data Import',
  sequence_step: 'Sequence Step',
  activity_tracking: 'Activity Tracking',
  notification_send: 'Notification Send',
  other: 'Other'
}

export const DLQ_JOB_TYPE_ICONS: Record<DLQJobType, string> = {
  email_send: '📧',
  crm_sync: '🔄',
  data_enrichment: '✨',
  webhook_delivery: '🔗',
  report_generation: '📊',
  data_import: '📥',
  sequence_step: '⏭️',
  activity_tracking: '📈',
  notification_send: '🔔',
  other: '❓'
}
