/**
 * Tag Types
 * Supports flexible labeling and categorization of entities
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type EntityType = 'account' | 'contact' | 'opportunity' | 'task' | 'activity'

// ============================================================================
// MAIN TAG INTERFACE
// ============================================================================

export interface Tag {
  id: string
  workspace_id: string
  name: string
  color: string // hex color code (e.g., '#3B82F6')
  description: string | null
  entity_type: EntityType | null // if null, tag can be used for all entity types

  created_by: string | null
  created_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new tag
 */
export type TagCreate = Omit<Tag, 'id' | 'created_at'> & {
  workspace_id: string
  name: string
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a tag
 */
export type TagUpdate = Partial<
  Omit<Tag, 'id' | 'workspace_id' | 'created_at' | 'created_by'>
>

// ============================================================================
// ENTITY TAG INTERFACE
// ============================================================================

/**
 * Represents the assignment of a tag to an entity
 */
export interface EntityTag {
  id: string
  tag_id: string
  entity_type: EntityType
  entity_id: string

  tagged_by: string | null
  tagged_at: string
}

// ============================================================================
// ENTITY TAG CREATE/UPDATE TYPES
// ============================================================================

/**
 * Type for creating an entity tag assignment
 */
export type EntityTagCreate = Omit<EntityTag, 'id' | 'tagged_at'> & {
  tag_id: string
  entity_type: EntityType
  entity_id: string
}

/**
 * Type for bulk tagging multiple entities
 */
export interface BulkEntityTagCreate {
  tag_id: string
  entity_type: EntityType
  entity_ids: string[]
}

/**
 * Type for bulk untagging
 */
export interface BulkEntityTagDelete {
  tag_id: string
  entity_type: EntityType
  entity_ids: string[]
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for querying tags
 */
export interface TagFilters {
  workspace_id?: string
  entity_type?: EntityType | EntityType[] | null
  name?: string
  search_query?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Tag
  order_direction?: 'asc' | 'desc'
}

/**
 * Filters for querying entity tags
 */
export interface EntityTagFilters {
  tag_id?: string | string[]
  entity_type?: EntityType | EntityType[]
  entity_id?: string | string[]
  tagged_by?: string

  // Date filters
  tagged_after?: string
  tagged_before?: string

  // Pagination
  limit?: number
  offset?: number
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Tag with usage count
 */
export interface TagWithCount extends Tag {
  usage_count: number
  last_used_at: string | null
}

/**
 * Tag with entity information
 */
export interface TagWithEntity extends Tag {
  entity_tag: EntityTag
  entity_name?: string // Name of the tagged entity (if applicable)
}

/**
 * Entity with its tags
 */
export interface EntityWithTags {
  entity_id: string
  entity_type: EntityType
  tags: Tag[]
}

/**
 * Tag statistics
 */
export interface TagStats {
  tag_id: string
  tag_name: string
  tag_color: string
  total_usage: number
  usage_by_entity_type: Record<EntityType, number>
  recent_usage_count: number // Last 30 days
  most_tagged_entities: Array<{
    entity_id: string
    entity_type: EntityType
    entity_name: string
  }>
  created_at: string
  last_used_at: string | null
}

/**
 * Tag group (for organizing tags)
 */
export interface TagGroup {
  id: string
  workspace_id: string
  name: string
  description: string | null
  color: string
  tag_ids: string[]
  order: number
  created_at: string
  updated_at: string
}

/**
 * Tag cloud data (for visualization)
 */
export interface TagCloudItem {
  tag: Tag
  count: number
  weight: number // 1-10 for sizing
  percentage: number // percentage of total
}

/**
 * Predefined tag color palette
 */
export const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue (default)
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
  '#64748B', // slate
  '#6B7280', // gray
  '#78716C', // stone
] as const

export type TagColor = typeof TAG_COLORS[number]

/**
 * Tag suggestion (for auto-complete)
 */
export interface TagSuggestion {
  tag: Tag
  relevance_score: number
  reason: string
  is_existing: boolean
}

/**
 * Bulk tag operation result
 */
export interface BulkTagResult {
  success: boolean
  tagged_count: number
  failed_count: number
  errors: Array<{
    entity_id: string
    error: string
  }>
}

/**
 * Tag filter condition (for advanced filtering)
 */
export interface TagFilterCondition {
  operator: 'has_all' | 'has_any' | 'has_none'
  tag_ids: string[]
}

/**
 * Entity query by tags
 */
export interface EntityTagQuery {
  entity_type: EntityType
  conditions: TagFilterCondition[]
  combine_with: 'AND' | 'OR'
}

/**
 * Tag template (predefined tag sets)
 */
export interface TagTemplate {
  id: string
  name: string
  description: string
  entity_type: EntityType | null
  tags: Array<{
    name: string
    color: string
    description?: string
  }>
  category?: string
  is_system?: boolean
}

// ============================================================================
// COMMON TAG TEMPLATES
// ============================================================================

export const ACCOUNT_TAG_TEMPLATES: TagTemplate[] = [
  {
    id: 'account_priority',
    name: 'Account Priority',
    description: 'Priority levels for accounts',
    entity_type: 'account',
    category: 'priority',
    is_system: true,
    tags: [
      { name: 'High Priority', color: '#EF4444', description: 'Top priority account' },
      { name: 'Medium Priority', color: '#F97316', description: 'Standard priority' },
      { name: 'Low Priority', color: '#64748B', description: 'Lower priority' }
    ]
  },
  {
    id: 'account_segments',
    name: 'Account Segments',
    description: 'Market segmentation for accounts',
    entity_type: 'account',
    category: 'segment',
    is_system: true,
    tags: [
      { name: 'Strategic', color: '#8B5CF6', description: 'Strategic account' },
      { name: 'Key Account', color: '#3B82F6', description: 'Key customer' },
      { name: 'Growth', color: '#22C55E', description: 'High growth potential' },
      { name: 'At Risk', color: '#F59E0B', description: 'Churn risk' },
      { name: 'Partner', color: '#14B8A6', description: 'Partnership account' }
    ]
  },
  {
    id: 'industry_vertical',
    name: 'Industry Vertical',
    description: 'Industry-specific tags',
    entity_type: 'account',
    category: 'industry',
    is_system: true,
    tags: [
      { name: 'Healthcare', color: '#EC4899' },
      { name: 'Finance', color: '#10B981' },
      { name: 'Technology', color: '#6366F1' },
      { name: 'Manufacturing', color: '#F97316' },
      { name: 'Retail', color: '#EAB308' },
      { name: 'Education', color: '#14B8A6' }
    ]
  }
]

export const CONTACT_TAG_TEMPLATES: TagTemplate[] = [
  {
    id: 'contact_status',
    name: 'Contact Status',
    description: 'Engagement status for contacts',
    entity_type: 'contact',
    category: 'status',
    is_system: true,
    tags: [
      { name: 'Engaged', color: '#22C55E', description: 'Actively engaged' },
      { name: 'Nurturing', color: '#3B82F6', description: 'In nurture campaign' },
      { name: 'Responded', color: '#10B981', description: 'Has responded to outreach' },
      { name: 'Meeting Booked', color: '#8B5CF6', description: 'Meeting scheduled' },
      { name: 'Unresponsive', color: '#64748B', description: 'Not responding' }
    ]
  },
  {
    id: 'contact_role',
    name: 'Contact Role',
    description: 'Role in buying process',
    entity_type: 'contact',
    category: 'role',
    is_system: true,
    tags: [
      { name: 'Decision Maker', color: '#EF4444' },
      { name: 'Influencer', color: '#F97316' },
      { name: 'Champion', color: '#22C55E' },
      { name: 'Blocker', color: '#64748B' },
      { name: 'End User', color: '#3B82F6' }
    ]
  }
]

export const OPPORTUNITY_TAG_TEMPLATES: TagTemplate[] = [
  {
    id: 'opportunity_source',
    name: 'Opportunity Source',
    description: 'How the opportunity was generated',
    entity_type: 'opportunity',
    category: 'source',
    is_system: true,
    tags: [
      { name: 'Inbound', color: '#22C55E' },
      { name: 'Outbound', color: '#3B82F6' },
      { name: 'Referral', color: '#8B5CF6' },
      { name: 'Partner', color: '#14B8A6' },
      { name: 'Event', color: '#F97316' }
    ]
  }
]

export const ALL_TAG_TEMPLATES = [
  ...ACCOUNT_TAG_TEMPLATES,
  ...CONTACT_TAG_TEMPLATES,
  ...OPPORTUNITY_TAG_TEMPLATES
]
