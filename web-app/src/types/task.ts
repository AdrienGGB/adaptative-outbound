/**
 * Task Types
 * Represents manual action items and to-dos
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type TaskType =
  | 'call'
  | 'linkedin_message'
  | 'linkedin_connect'
  | 'research'
  | 'demo'
  | 'follow_up'
  | 'email'
  | 'meeting'
  | 'send_proposal'
  | 'contract_review'
  | 'onboarding'
  | 'other'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ============================================================================
// MAIN TASK INTERFACE
// ============================================================================

export interface Task {
  id: string
  workspace_id: string

  // Assignments
  assigned_to: string | null // user ID
  contact_id: string | null
  account_id: string | null
  // sequence_enrollment_id: string | null // Future feature (F003)

  // Task Details
  task_type: TaskType
  description: string | null
  priority: TaskPriority

  // Scheduling
  due_date: string | null // ISO 8601 timestamp
  reminder_at: string | null // ISO 8601 timestamp

  // Status
  status: TaskStatus

  // Completion
  completed_by: string | null
  completed_at: string | null
  completion_notes: string | null

  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new task
 */
export type TaskCreate = Omit<
  Task,
  'id' | 'created_at' | 'updated_at' | 'completed_by' | 'completed_at'
> & {
  workspace_id: string
  task_type: TaskType
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a task
 */
export type TaskUpdate = Partial<
  Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'created_by'>
>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Common filters for querying tasks
 */
export interface TaskFilters {
  workspace_id?: string
  assigned_to?: string | string[]
  contact_id?: string | string[]
  account_id?: string | string[]
  task_type?: TaskType | TaskType[]
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]

  // Date filters
  due_before?: string
  due_after?: string
  created_after?: string
  created_before?: string
  completed_after?: string
  completed_before?: string

  // Boolean filters
  is_overdue?: boolean
  is_due_today?: boolean
  is_due_this_week?: boolean
  has_reminder?: boolean

  // Search
  search_query?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Task
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Task with expanded relations
 */
export interface TaskWithRelations extends Task {
  assigned_to_user?: {
    id: string
    email: string
    full_name: string
  }
  contact?: {
    id: string
    full_name: string
    email: string | null
    job_title: string | null
  }
  account?: {
    id: string
    name: string
    domain: string | null
  }
  created_by_user?: {
    id: string
    email: string
    full_name: string
  }
  completed_by_user?: {
    id: string
    email: string
    full_name: string
  }
}

/**
 * Task list item (minimal info for lists)
 */
export interface TaskListItem {
  id: string
  task_type: TaskType
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  assigned_to_name: string | null
  contact_name: string | null
  account_name: string | null
  is_overdue: boolean
}

/**
 * Task group (for grouping tasks in UI)
 */
export interface TaskGroup {
  group_key: string
  group_label: string
  tasks: TaskWithRelations[]
  count: number
}

/**
 * Task statistics/metrics
 */
export interface TaskMetrics {
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  cancelled_tasks: number
  overdue_tasks: number
  due_today: number
  due_this_week: number
  tasks_by_type: Record<TaskType, number>
  tasks_by_priority: Record<TaskPriority, number>
  tasks_by_assignee: Array<{
    user_id: string
    user_name: string
    task_count: number
    pending_count: number
    overdue_count: number
  }>
  completion_rate: number // percentage
  average_completion_time_hours: number
}

/**
 * User task summary
 */
export interface UserTaskSummary {
  user_id: string
  user_name: string
  total_assigned: number
  pending: number
  in_progress: number
  completed_today: number
  completed_this_week: number
  overdue: number
  due_today: number
  due_this_week: number
  high_priority_count: number
  urgent_priority_count: number
}

/**
 * Task template (for common task types)
 */
export interface TaskTemplate {
  id: string
  name: string
  description: string
  task_type: TaskType
  priority: TaskPriority
  default_description: string
  estimated_duration_minutes?: number
  category?: string
  is_system?: boolean
}

/**
 * Bulk task creation
 */
export interface BulkTaskCreate {
  workspace_id: string
  task_type: TaskType
  priority: TaskPriority
  description: string
  due_date?: string
  contact_ids?: string[]
  account_ids?: string[]
  assigned_to?: string
}

/**
 * Bulk task update
 */
export interface BulkTaskUpdate {
  task_ids: string[]
  updates: TaskUpdate
}

/**
 * Task completion payload
 */
export interface TaskCompletion {
  task_id: string
  completion_notes?: string
  create_follow_up?: boolean
  follow_up_task?: Partial<TaskCreate>
}

/**
 * Task reminder configuration
 */
export interface TaskReminderConfig {
  task_id: string
  reminder_at: string
  reminder_method: 'email' | 'push' | 'both'
  reminder_message?: string
}

/**
 * Task activity timeline
 */
export interface TaskActivity {
  id: string
  task_id: string
  activity_type: 'created' | 'updated' | 'completed' | 'cancelled' | 'reopened' | 'reassigned' | 'comment_added'
  description: string
  performed_by: string
  performed_by_name?: string
  changes?: Record<string, { old: any; new: any }>
  occurred_at: string
}

/**
 * Task comment
 */
export interface TaskComment {
  id: string
  task_id: string
  comment: string
  mentioned_users?: string[]
  created_by: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// TASK PRIORITY HELPERS
// ============================================================================

export const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#EF4444', // red
  high: '#F97316', // orange
  medium: '#3B82F6', // blue
  low: '#64748B' // slate
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
}

// ============================================================================
// TASK STATUS HELPERS
// ============================================================================

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#64748B', // slate
  in_progress: '#3B82F6', // blue
  completed: '#22C55E', // green
  cancelled: '#EF4444' // red
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// ============================================================================
// TASK TYPE HELPERS
// ============================================================================

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  call: '📞',
  email: '📧',
  linkedin_message: '💼',
  linkedin_connect: '🔗',
  research: '🔍',
  demo: '🎥',
  follow_up: '👋',
  meeting: '📅',
  send_proposal: '📄',
  contract_review: '📋',
  onboarding: '🚀',
  other: '📝'
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: 'Call',
  email: 'Email',
  linkedin_message: 'LinkedIn Message',
  linkedin_connect: 'LinkedIn Connect',
  research: 'Research',
  demo: 'Demo',
  follow_up: 'Follow Up',
  meeting: 'Meeting',
  send_proposal: 'Send Proposal',
  contract_review: 'Contract Review',
  onboarding: 'Onboarding',
  other: 'Other'
}

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  call: '#22C55E',
  email: '#3B82F6',
  linkedin_message: '#0A66C2',
  linkedin_connect: '#0A66C2',
  research: '#8B5CF6',
  demo: '#F59E0B',
  follow_up: '#14B8A6',
  meeting: '#EC4899',
  send_proposal: '#6366F1',
  contract_review: '#F97316',
  onboarding: '#10B981',
  other: '#64748B'
}

// ============================================================================
// COMMON TASK TEMPLATES
// ============================================================================

export const COMMON_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'initial_call',
    name: 'Initial Discovery Call',
    description: 'First call to understand needs and qualify',
    task_type: 'call',
    priority: 'high',
    default_description: 'Schedule and complete initial discovery call to understand business needs, pain points, and qualification criteria.',
    estimated_duration_minutes: 30,
    category: 'prospecting'
  },
  {
    id: 'send_follow_up',
    name: 'Follow-up Email',
    description: 'Send follow-up email after meeting or call',
    task_type: 'email',
    priority: 'medium',
    default_description: 'Send follow-up email summarizing discussion points, next steps, and any promised materials.',
    estimated_duration_minutes: 15,
    category: 'follow-up'
  },
  {
    id: 'linkedin_connect',
    name: 'LinkedIn Connection Request',
    description: 'Send personalized LinkedIn connection request',
    task_type: 'linkedin_connect',
    priority: 'low',
    default_description: 'Send personalized LinkedIn connection request with context about why you want to connect.',
    estimated_duration_minutes: 5,
    category: 'prospecting'
  },
  {
    id: 'research_account',
    name: 'Account Research',
    description: 'Research company background and context',
    task_type: 'research',
    priority: 'medium',
    default_description: 'Research company website, recent news, LinkedIn, and other sources to understand business, recent developments, and key stakeholders.',
    estimated_duration_minutes: 20,
    category: 'prospecting'
  },
  {
    id: 'schedule_demo',
    name: 'Product Demo',
    description: 'Schedule and deliver product demonstration',
    task_type: 'demo',
    priority: 'high',
    default_description: 'Schedule and deliver customized product demo focused on prospect\'s specific use cases and pain points.',
    estimated_duration_minutes: 60,
    category: 'sales'
  },
  {
    id: 'send_proposal',
    name: 'Send Proposal',
    description: 'Prepare and send customized proposal',
    task_type: 'send_proposal',
    priority: 'high',
    default_description: 'Prepare customized proposal including pricing, implementation timeline, and terms. Review internally before sending.',
    estimated_duration_minutes: 90,
    category: 'sales'
  }
]
