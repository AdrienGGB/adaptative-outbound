/**
 * Team Types
 * Represents sales teams and organizational groups
 */

// ============================================================================
// MAIN TEAM INTERFACE
// ============================================================================

export interface Team {
  id: string
  workspace_id: string

  // Team Information
  name: string
  description: string | null

  // Team Lead
  team_lead_id: string | null

  // Metadata
  created_at: string
  updated_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new team
 */
export type TeamCreate = Omit<Team, 'id' | 'created_at' | 'updated_at'> & {
  workspace_id: string
  name: string
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a team
 */
export type TeamUpdate = Partial<
  Omit<Team, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for querying teams
 */
export interface TeamFilters {
  workspace_id?: string
  team_lead_id?: string
  name?: string
  search_query?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Team
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Team with expanded relations
 */
export interface TeamWithRelations extends Team {
  team_lead?: {
    id: string
    email: string
    full_name: string
  }
  member_count?: number
  members?: Array<{
    id: string
    email: string
    full_name: string
    role: string
  }>
}

/**
 * Team member
 * Note: Team members are workspace_members with assigned_team_id
 */
export interface TeamMember {
  user_id: string
  email: string
  full_name: string
  role: string
  team_id: string
  joined_at: string
}

/**
 * Team statistics
 */
export interface TeamStats {
  team_id: string
  team_name: string
  member_count: number

  // Account ownership
  total_accounts: number
  active_accounts: number
  accounts_by_lifecycle: Record<string, number>

  // Contact ownership
  total_contacts: number
  active_contacts: number

  // Activity metrics
  activities_this_week: number
  activities_this_month: number
  emails_sent_this_week: number
  calls_made_this_week: number
  meetings_held_this_week: number

  // Task metrics
  open_tasks: number
  overdue_tasks: number
  completed_tasks_this_week: number

  // Performance metrics
  average_response_time_hours: number
  average_activities_per_member: number
  top_performers: Array<{
    user_id: string
    user_name: string
    activity_count: number
  }>
}

/**
 * Team performance comparison
 */
export interface TeamPerformance {
  team_id: string
  team_name: string
  period: 'week' | 'month' | 'quarter'

  // Volume metrics
  accounts_created: number
  contacts_added: number
  activities_logged: number
  tasks_completed: number

  // Engagement metrics
  emails_sent: number
  email_open_rate: number
  email_reply_rate: number
  calls_made: number
  meetings_held: number

  // Outcome metrics
  opportunities_created: number
  deals_won: number
  revenue_generated: number

  // Efficiency metrics
  average_time_to_first_contact_hours: number
  average_touch_points_to_meeting: number
  average_sales_cycle_days: number

  // Ranking
  rank?: number
  rank_change?: number
}

/**
 * Team assignment change
 */
export interface TeamAssignmentChange {
  entity_type: 'account' | 'user'
  entity_id: string
  from_team_id: string | null
  to_team_id: string | null
  changed_by: string
  changed_at: string
  reason?: string
}

/**
 * Team quota (future feature)
 */
export interface TeamQuota {
  id: string
  team_id: string
  period: 'monthly' | 'quarterly' | 'yearly'
  period_start: string
  period_end: string

  // Targets
  target_revenue: number
  target_deals: number
  target_meetings: number
  target_activities: number

  // Progress
  actual_revenue: number
  actual_deals: number
  actual_meetings: number
  actual_activities: number

  // Calculated
  revenue_attainment_percentage: number
  deals_attainment_percentage: number
  meetings_attainment_percentage: number
  activities_attainment_percentage: number

  created_at: string
  updated_at: string
}

/**
 * Team hierarchy (for nested teams - future feature)
 */
export interface TeamHierarchy {
  team: Team
  parent_team_id: string | null
  child_teams: Team[]
  level: number
}

/**
 * Team list item (minimal info for dropdowns)
 */
export interface TeamListItem {
  id: string
  name: string
  member_count: number
  team_lead_name: string | null
}

/**
 * Bulk team assignment
 */
export interface BulkTeamAssignment {
  entity_type: 'account' | 'user'
  entity_ids: string[]
  team_id: string | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user is a team lead
 */
export function isTeamLead(userId: string, team: Team): boolean {
  return team.team_lead_id === userId
}

/**
 * Get team member count from a team with relations
 */
export function getTeamMemberCount(team: TeamWithRelations): number {
  return team.member_count ?? team.members?.length ?? 0
}
