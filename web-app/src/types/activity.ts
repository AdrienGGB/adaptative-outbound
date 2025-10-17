/**
 * Activity Types
 * Represents interaction history and engagement tracking
 */

// ============================================================================
// ACTIVITY TYPE ENUMS
// ============================================================================

export type ActivityType =
  // Email activities
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'email_bounced'
  // Call activities
  | 'call_completed'
  | 'call_missed'
  | 'call_voicemail'
  // Meeting activities
  | 'meeting_scheduled'
  | 'meeting_held'
  | 'meeting_no_show'
  // LinkedIn activities
  | 'linkedin_message_sent'
  | 'linkedin_connection_request'
  | 'linkedin_connection_accepted'
  // Website activities
  | 'website_visit'
  | 'content_downloaded'
  | 'demo_completed'
  | 'trial_started'
  // Other activities
  | 'note_added'
  | 'task_completed'

export type ActivityCategory =
  | 'email'
  | 'call'
  | 'meeting'
  | 'social'
  | 'website'
  | 'note'
  | 'task'

export type ActivityOutcome =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'no_answer'
  | 'not_interested'
  | 'interested'
  | 'callback_requested'
  | 'voicemail_left'

export type ActivitySource =
  | 'manual'
  | 'crm_sync'
  | 'email_tracking'
  | 'sequence'
  | 'api'
  | 'chrome_extension'
  | 'webhook'

// ============================================================================
// ACTIVITY DATA INTERFACES
// ============================================================================

/**
 * Email activity data structure
 */
export interface EmailActivityData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  from: string
  thread_id?: string
  message_id?: string
  attachments?: Array<{
    filename: string
    size: number
    content_type: string
    url?: string
  }>
  subject?: string
  preview_text?: string
  template_id?: string
  sequence_step_id?: string
  opened_at?: string
  clicked_at?: string
  clicked_links?: string[]
  bounce_type?: 'hard' | 'soft' | 'complaint'
  bounce_reason?: string
}

/**
 * Call activity data structure
 */
export interface CallActivityData {
  duration_seconds: number
  outcome: ActivityOutcome
  phone_number: string
  direction: 'inbound' | 'outbound'
  recording_url?: string
  transcript_url?: string
  transcript_text?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  key_moments?: Array<{
    timestamp: number
    description: string
    type: 'objection' | 'question' | 'commitment' | 'pain_point'
  }>
  ai_summary?: string
  next_steps?: string[]
}

/**
 * Meeting activity data structure
 */
export interface MeetingActivityData {
  attendees: Array<{
    email: string
    name?: string
    contact_id?: string
    status?: 'accepted' | 'declined' | 'tentative' | 'no_response'
  }>
  duration_minutes: number
  meeting_url?: string
  meeting_type?: 'in_person' | 'video' | 'phone'
  calendar_event_id?: string
  location?: string
  recording_url?: string
  transcript_url?: string
  notes?: string
  action_items?: Array<{
    description: string
    assigned_to?: string
    due_date?: string
  }>
  topics_discussed?: string[]
  next_meeting_scheduled?: string
}

/**
 * LinkedIn activity data structure
 */
export interface LinkedInActivityData {
  message_text?: string
  connection_degree?: '1st' | '2nd' | '3rd'
  profile_url: string
  post_url?: string
  engagement_type?: 'like' | 'comment' | 'share' | 'message'
  connection_note?: string
}

/**
 * Website activity data structure
 */
export interface WebsiteActivityData {
  page_url: string
  referrer?: string
  pages_visited?: Array<{
    url: string
    title: string
    time_on_page_seconds: number
    visited_at: string
  }>
  session_duration_seconds?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  device_type?: 'desktop' | 'mobile' | 'tablet'
  browser?: string
  ip_address?: string
  country?: string
  city?: string
}

/**
 * Content download activity data
 */
export interface ContentDownloadData {
  content_type: 'whitepaper' | 'ebook' | 'case_study' | 'template' | 'report' | 'video'
  content_title: string
  content_url: string
  download_url?: string
  form_fields_submitted?: Record<string, string>
}

/**
 * Note activity data
 */
export interface NoteActivityData {
  note_type?: 'general' | 'call_notes' | 'meeting_notes' | 'research'
  is_pinned?: boolean
  mentions?: string[] // user IDs mentioned in note
  attachments?: Array<{
    filename: string
    url: string
    type: string
  }>
}

/**
 * Generic activity data type (union of all specific types)
 */
export type ActivityData =
  | EmailActivityData
  | CallActivityData
  | MeetingActivityData
  | LinkedInActivityData
  | WebsiteActivityData
  | ContentDownloadData
  | NoteActivityData
  | Record<string, any> // Fallback for custom activity types

// ============================================================================
// MAIN ACTIVITY INTERFACE
// ============================================================================

export interface Activity {
  // Identity
  id: string
  workspace_id: string

  // Relationships
  account_id: string | null
  contact_id: string | null
  user_id: string | null // who performed the activity

  // Activity Classification
  activity_type: ActivityType
  activity_category: ActivityCategory | null

  // Activity Content
  subject: string | null
  description: string | null
  body: string | null // full email body, call transcript, meeting notes, etc.

  // Activity Data (flexible JSON storage)
  activity_data: ActivityData

  // Outcome & Sentiment
  outcome: ActivityOutcome | null
  sentiment_score: number | null // -1.0 to 1.0 (from AI analysis)

  // Timing
  occurred_at: string // ISO 8601 timestamp
  duration_seconds: number | null
  scheduled_for: string | null // for future activities

  // Source Tracking
  source: ActivitySource | null
  source_id: string | null // UUID in source system
  external_id: string | null // ID from external system

  // Metadata
  created_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new activity
 */
export type ActivityCreate = Omit<Activity, 'id' | 'created_at'> & {
  workspace_id: string
  activity_type: ActivityType
  occurred_at: string
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating an activity
 * Most fields can be updated except core identity fields
 */
export type ActivityUpdate = Partial<
  Omit<Activity, 'id' | 'workspace_id' | 'created_at'>
>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Common filters for querying activities
 */
export interface ActivityFilters {
  workspace_id?: string
  account_id?: string | string[]
  contact_id?: string | string[]
  user_id?: string | string[]
  activity_type?: ActivityType | ActivityType[]
  activity_category?: ActivityCategory | ActivityCategory[]
  outcome?: ActivityOutcome | ActivityOutcome[]
  source?: ActivitySource | ActivitySource[]
  source_id?: string

  // Date range filters
  occurred_after?: string
  occurred_before?: string
  created_after?: string
  created_before?: string

  // Sentiment filters
  min_sentiment?: number // -1.0 to 1.0
  max_sentiment?: number

  // Duration filters
  min_duration_seconds?: number
  max_duration_seconds?: number

  // Search
  search_query?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Activity
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Activity with expanded relations
 */
export interface ActivityWithRelations extends Activity {
  account?: {
    id: string
    name: string
    domain: string | null
  }
  contact?: {
    id: string
    full_name: string
    email: string | null
    job_title: string | null
  }
  user?: {
    id: string
    email: string
    full_name: string
  }
}

/**
 * Activity timeline item (for rendering activity feeds)
 */
export interface ActivityTimelineItem {
  id: string
  activity_type: ActivityType
  activity_category: ActivityCategory | null
  subject: string | null
  description: string | null
  occurred_at: string
  user_name: string | null
  contact_name: string | null
  account_name: string | null
  outcome: ActivityOutcome | null
  icon?: string
  color?: string
}

/**
 * Activity statistics/metrics
 */
export interface ActivityMetrics {
  total_activities: number
  activities_by_type: Record<ActivityType, number>
  activities_by_category: Record<ActivityCategory, number>
  activities_by_outcome: Record<ActivityOutcome, number>
  activities_last_7_days: number
  activities_last_30_days: number
  average_activities_per_contact: number
  most_active_users: Array<{
    user_id: string
    user_name: string
    activity_count: number
  }>
}

/**
 * Email activity statistics
 */
export interface EmailMetrics {
  total_sent: number
  total_opened: number
  total_clicked: number
  total_replied: number
  total_bounced: number
  open_rate: number // percentage
  click_rate: number // percentage
  reply_rate: number // percentage
  bounce_rate: number // percentage
  average_time_to_open_minutes: number
  average_time_to_reply_hours: number
}

/**
 * Call activity statistics
 */
export interface CallMetrics {
  total_calls: number
  completed_calls: number
  missed_calls: number
  voicemails: number
  average_duration_seconds: number
  total_duration_seconds: number
  calls_by_outcome: Record<ActivityOutcome, number>
  connection_rate: number // percentage
  positive_outcome_rate: number // percentage
}

/**
 * Meeting activity statistics
 */
export interface MeetingMetrics {
  total_meetings: number
  held_meetings: number
  no_shows: number
  average_duration_minutes: number
  total_attendees: number
  average_attendees_per_meeting: number
  meetings_by_type: Record<'in_person' | 'video' | 'phone', number>
  show_rate: number // percentage
}

/**
 * Activity summary for a contact or account
 */
export interface ActivitySummary {
  entity_id: string
  entity_type: 'contact' | 'account'
  total_activities: number
  last_activity_at: string | null
  last_activity_type: ActivityType | null
  activities_by_type: Partial<Record<ActivityType, number>>
  email_metrics: EmailMetrics
  call_metrics: CallMetrics
  meeting_metrics: MeetingMetrics
  engagement_score: number // calculated score
  engagement_trend: 'increasing' | 'stable' | 'decreasing'
}
