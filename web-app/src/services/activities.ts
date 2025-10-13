// @ts-nocheck
/**
 * Activity Service
 * Handles activity logging and timeline queries
 */

import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  ActivityCreate,
  ActivityFilters,
  ActivityType,
  EmailActivityData,
  CallActivityData,
  MeetingActivityData,
} from '@/types'

// ============================================================================
// CORE OPERATIONS
// ============================================================================

/**
 * Log a new activity
 */
export async function logActivity(data: ActivityCreate): Promise<Activity> {
  try {
    const supabase = createClient()

    const { data: activity, error } = await supabase
      .from('activities')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return activity as Activity
  } catch (error) {
    console.error('Failed to log activity:', error)
    throw new Error('Failed to log activity')
  }
}

/**
 * Get a single activity by ID
 */
export async function getActivity(id: string): Promise<Activity | null> {
  try {
    const supabase = createClient()

    const { data: activity, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return activity as Activity
  } catch (error) {
    console.error('Failed to get activity:', error)
    throw new Error('Failed to get activity')
  }
}

/**
 * Get activities with optional filtering
 */
export async function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  try {
    const supabase = createClient()
    let query = supabase.from('activities').select('*')

    if (filters) {
      // Workspace filter
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id)
      }

      // Account filter
      if (filters.account_id) {
        if (Array.isArray(filters.account_id)) {
          query = query.in('account_id', filters.account_id)
        } else {
          query = query.eq('account_id', filters.account_id)
        }
      }

      // Contact filter
      if (filters.contact_id) {
        if (Array.isArray(filters.contact_id)) {
          query = query.in('contact_id', filters.contact_id)
        } else {
          query = query.eq('contact_id', filters.contact_id)
        }
      }

      // Activity type filter
      if (filters.activity_type) {
        if (Array.isArray(filters.activity_type)) {
          query = query.in('activity_type', filters.activity_type)
        } else {
          query = query.eq('activity_type', filters.activity_type)
        }
      }

      // Activity category filter
      if (filters.activity_category) {
        if (Array.isArray(filters.activity_category)) {
          query = query.in('activity_category', filters.activity_category)
        } else {
          query = query.eq('activity_category', filters.activity_category)
        }
      }

      // Outcome filter
      if (filters.outcome) {
        if (Array.isArray(filters.outcome)) {
          query = query.in('outcome', filters.outcome)
        } else {
          query = query.eq('outcome', filters.outcome)
        }
      }

      // Source filter
      if (filters.source) {
        if (Array.isArray(filters.source)) {
          query = query.in('source', filters.source)
        } else {
          query = query.eq('source', filters.source)
        }
      }

      // User filter
      if (filters.user_id) {
        if (Array.isArray(filters.user_id)) {
          query = query.in('user_id', filters.user_id)
        } else {
          query = query.eq('user_id', filters.user_id)
        }
      }

      // Date filters
      if (filters.occurred_after) {
        query = query.gte('occurred_at', filters.occurred_after)
      }
      if (filters.occurred_before) {
        query = query.lte('occurred_at', filters.occurred_before)
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before)
      }

      // Limit and offset
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      // Order by
      if (filters.order_by) {
        const direction = filters.order_direction || 'desc'
        query = query.order(filters.order_by, { ascending: direction === 'asc' })
      } else {
        // Default: most recent first
        query = query.order('occurred_at', { ascending: false })
      }
    } else {
      // Default ordering if no filters
      query = query.order('occurred_at', { ascending: false })
    }

    const { data: activities, error } = await query

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get activities:', error)
    throw new Error('Failed to get activities')
  }
}

/**
 * Update an activity
 */
export async function updateActivity(
  id: string,
  data: Partial<Activity>
): Promise<Activity> {
  try {
    const supabase = createClient()

    const { data: activity, error } = await supabase
      .from('activities')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return activity as Activity
  } catch (error) {
    console.error('Failed to update activity:', error)
    throw new Error('Failed to update activity')
  }
}

// ============================================================================
// TIMELINE QUERIES
// ============================================================================

/**
 * Get activity timeline for an account
 */
export async function getAccountTimeline(accountId: string): Promise<Activity[]> {
  try {
    const supabase = createClient()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('account_id', accountId)
      .order('occurred_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get account timeline:', error)
    throw new Error('Failed to get account timeline')
  }
}

/**
 * Get activity timeline for a contact
 */
export async function getContactTimeline(contactId: string): Promise<Activity[]> {
  try {
    const supabase = createClient()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('occurred_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get contact timeline:', error)
    throw new Error('Failed to get contact timeline')
  }
}

/**
 * Get recent activities for a workspace
 */
export async function getWorkspaceTimeline(
  workspaceId: string,
  limit: number = 50
): Promise<Activity[]> {
  try {
    const supabase = createClient()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get workspace timeline:', error)
    throw new Error('Failed to get workspace timeline')
  }
}

// ============================================================================
// SPECIFIC ACTIVITY TYPE HELPERS
// ============================================================================

/**
 * Helper type for creating email activities
 */
export interface EmailActivityCreate {
  workspace_id: string
  account_id?: string | null
  contact_id?: string | null
  to: string[]
  from: string
  subject?: string
  preview_text?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    size: number
    content_type: string
    url?: string
  }>
  template_id?: string
  occurred_at?: string
}

/**
 * Log an email activity
 */
export async function logEmail(data: EmailActivityCreate): Promise<Activity> {
  const activityData: ActivityCreate = {
    workspace_id: data.workspace_id,
    account_id: data.account_id || null,
    contact_id: data.contact_id || null,
    user_id: null,
    activity_type: 'email_sent',
    activity_category: 'email',
    subject: data.subject || null,
    description: data.preview_text || null,
    body: null,
    occurred_at: data.occurred_at || new Date().toISOString(),
    activity_data: {
      to: data.to,
      from: data.from,
      subject: data.subject,
      preview_text: data.preview_text,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      template_id: data.template_id,
    } as EmailActivityData,
    outcome: null,
    sentiment_score: null,
    duration_seconds: null,
    scheduled_for: null,
    source: 'manual',
    source_id: null,
    external_id: null,
  }

  return logActivity(activityData)
}

/**
 * Helper type for creating call activities
 */
export interface CallActivityCreate {
  workspace_id: string
  account_id?: string | null
  contact_id?: string | null
  phone_number: string
  direction: 'inbound' | 'outbound'
  duration_seconds: number
  outcome: Activity['outcome']
  recording_url?: string
  transcript_text?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  next_steps?: string[]
  occurred_at?: string
}

/**
 * Log a call activity
 */
export async function logCall(data: CallActivityCreate): Promise<Activity> {
  const activityData: ActivityCreate = {
    workspace_id: data.workspace_id,
    account_id: data.account_id || null,
    contact_id: data.contact_id || null,
    user_id: null,
    activity_type: 'call_completed',
    activity_category: 'call',
    subject: null,
    description: null,
    body: null,
    outcome: data.outcome,
    occurred_at: data.occurred_at || new Date().toISOString(),
    activity_data: {
      phone_number: data.phone_number,
      direction: data.direction,
      duration_seconds: data.duration_seconds,
      outcome: data.outcome,
      recording_url: data.recording_url,
      transcript_text: data.transcript_text,
      sentiment: data.sentiment,
      next_steps: data.next_steps,
    } as CallActivityData,
    sentiment_score: null,
    duration_seconds: data.duration_seconds,
    scheduled_for: null,
    source: 'manual',
    source_id: null,
    external_id: null,
  }

  return logActivity(activityData)
}

/**
 * Helper type for creating meeting activities
 */
export interface MeetingActivityCreate {
  workspace_id: string
  account_id?: string | null
  contact_id?: string | null
  meeting_title: string
  duration_minutes: number
  attendees: Array<{
    email: string
    name: string
    attended?: boolean
  }>
  meeting_url?: string
  recording_url?: string
  notes?: string
  next_steps?: string[]
  occurred_at?: string
}

/**
 * Log a meeting activity
 */
export async function logMeeting(data: MeetingActivityCreate): Promise<Activity> {
  const activityData: ActivityCreate = {
    workspace_id: data.workspace_id,
    account_id: data.account_id || null,
    contact_id: data.contact_id || null,
    user_id: null,
    activity_type: 'meeting_held',
    activity_category: 'meeting',
    subject: data.meeting_title,
    description: data.notes || null,
    body: null,
    outcome: null,
    occurred_at: data.occurred_at || new Date().toISOString(),
    activity_data: {
      meeting_title: data.meeting_title,
      duration_minutes: data.duration_minutes,
      attendees: data.attendees,
      meeting_url: data.meeting_url,
      recording_url: data.recording_url,
      notes: data.notes,
      next_steps: data.next_steps,
    } as MeetingActivityData,
    sentiment_score: null,
    duration_seconds: data.duration_minutes * 60,
    scheduled_for: null,
    source: 'manual',
    source_id: null,
    external_id: null,
  }

  return logActivity(activityData)
}
