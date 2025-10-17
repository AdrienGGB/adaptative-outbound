/**
 * Contact Types
 * Represents individuals/people in the CRM
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type ContactStatus = 'active' | 'bounced' | 'opted_out' | 'invalid' | 'archived'
export type EmailStatus = 'verified' | 'unverified' | 'bounced' | 'invalid' | 'catch_all'
export type PhoneStatus = 'verified' | 'unverified' | 'invalid'
export type Department =
  | 'Sales'
  | 'Marketing'
  | 'Engineering'
  | 'Finance'
  | 'Operations'
  | 'HR'
  | 'IT'
  | 'Product'
  | 'Customer Success'
  | 'Legal'
  | 'Executive'
export type SeniorityLevel =
  | 'C-Level'
  | 'VP'
  | 'Director'
  | 'Manager'
  | 'Individual Contributor'
  | 'Entry Level'
export type BuyingRole =
  | 'Economic Buyer'
  | 'Technical Buyer'
  | 'User'
  | 'Coach'
  | 'Influencer'
  | 'Blocker'
export type EngagementLevel = 'hot' | 'warm' | 'cold' | 'unengaged'
export type ContactSource = 'import' | 'crm_sync' | 'manual' | 'enrichment' | 'web_form'

// ============================================================================
// MAIN CONTACT INTERFACE
// ============================================================================

export interface Contact {
  // Identity
  id: string
  workspace_id: string
  account_id: string | null
  external_id: string | null

  // Personal Information
  first_name: string | null
  last_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  mobile_phone: string | null
  direct_dial: string | null

  // Professional Details
  job_title: string | null
  normalized_title: string | null // standardized: 'CEO', 'CTO', 'VP Sales', etc.
  department: Department | null
  seniority_level: SeniorityLevel | null
  reports_to_id: string | null

  // Location
  city: string | null
  state: string | null
  country: string | null // ISO 3166-1 alpha-2 code
  timezone: string | null

  // Social Profiles
  linkedin_url: string | null
  linkedin_id: string | null
  twitter_handle: string | null
  twitter_url: string | null
  github_username: string | null

  // Contact Information Quality
  email_status: EmailStatus
  phone_status: PhoneStatus | null
  last_verified_at: string | null

  // Status & Preferences
  status: ContactStatus
  do_not_contact: boolean
  opted_out_at: string | null
  bounce_reason: string | null

  // Relationship & Influence
  is_decision_maker: boolean
  is_champion: boolean
  is_blocker: boolean
  buying_role: BuyingRole | null
  influence_score: number | null // 0-100
  engagement_level: EngagementLevel | null

  // Ownership
  owner_id: string | null

  // Computed Fields
  activity_count: number
  email_sent_count: number
  email_opened_count: number
  email_replied_count: number

  // Metadata
  source: ContactSource | null
  created_by: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  last_enriched_at: string | null

  // Search vector (excluded from create/update operations)
  search_vector?: unknown
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new contact
 * Excludes auto-generated fields and computed fields
 */
export type ContactCreate = Omit<
  Contact,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'search_vector'
  | 'activity_count'
  | 'email_sent_count'
  | 'email_opened_count'
  | 'email_replied_count'
> & {
  workspace_id: string
  full_name: string
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a contact
 * All fields are optional except ID and workspace_id
 */
export type ContactUpdate = Partial<
  Omit<
    Contact,
    | 'id'
    | 'workspace_id'
    | 'created_at'
    | 'updated_at'
    | 'search_vector'
    | 'activity_count'
    | 'email_sent_count'
    | 'email_opened_count'
    | 'email_replied_count'
  >
>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Common filters for querying contacts
 */
export interface ContactFilters {
  workspace_id?: string
  account_id?: string | string[]
  status?: ContactStatus | ContactStatus[]
  owner_id?: string | string[]
  email_status?: EmailStatus | EmailStatus[]
  department?: Department | Department[]
  seniority_level?: SeniorityLevel | SeniorityLevel[]
  buying_role?: BuyingRole | BuyingRole[]
  engagement_level?: EngagementLevel | EngagementLevel[]

  // Boolean filters
  is_decision_maker?: boolean
  is_champion?: boolean
  is_blocker?: boolean
  do_not_contact?: boolean
  has_email?: boolean
  has_phone?: boolean
  has_account?: boolean

  // Location filters
  country?: string | string[]
  state?: string | string[]
  city?: string | string[]

  // Date range filters
  created_after?: string
  created_before?: string
  last_contacted_after?: string
  last_contacted_before?: string

  // Engagement metrics
  min_influence_score?: number
  max_influence_score?: number
  min_email_opened_count?: number
  min_email_replied_count?: number

  // Search
  search_query?: string
  email?: string
  domain?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Contact
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// VERSION/AUDIT TRAIL TYPES
// ============================================================================

export type ContactChangeType = 'created' | 'updated' | 'deleted' | 'restored'
export type ContactChangeSource = 'user_edit' | 'crm_sync' | 'enrichment' | 'import' | 'api'

export interface ContactVersion {
  id: string
  contact_id: string
  data: Contact // Full contact snapshot
  changed_fields: string[]
  change_type: ContactChangeType
  changed_by: string | null
  change_source: ContactChangeSource | null
  change_reason: string | null
  version_number: number
  created_at: string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Contact with expanded relations
 */
export interface ContactWithRelations extends Contact {
  account?: {
    id: string
    name: string
    domain: string | null
    logo_url: string | null
    industry: string | null
  }
  owner?: {
    id: string
    email: string
    full_name: string
  }
  reports_to?: Pick<Contact, 'id' | 'full_name' | 'job_title'>
}

/**
 * Minimal contact info for lists and dropdowns
 */
export interface ContactListItem {
  id: string
  full_name: string
  email: string | null
  job_title: string | null
  account_id: string | null
  account_name?: string
  status: ContactStatus
  engagement_level: EngagementLevel | null
  is_decision_maker: boolean
  last_contacted_at: string | null
}

/**
 * Contact statistics/metrics
 */
export interface ContactMetrics {
  total_contacts: number
  active_contacts: number
  verified_emails: number
  decision_makers: number
  champions: number
  contacts_by_department: Record<Department, number>
  contacts_by_seniority: Record<SeniorityLevel, number>
  contacts_by_engagement: Record<EngagementLevel, number>
  average_engagement_score: number
  contacts_with_activity_last_30_days: number
}

/**
 * Contact engagement summary
 */
export interface ContactEngagement {
  contact_id: string
  email_sent_count: number
  email_opened_count: number
  email_replied_count: number
  email_open_rate: number // percentage
  email_reply_rate: number // percentage
  last_contacted_at: string | null
  last_opened_at: string | null
  last_replied_at: string | null
  engagement_level: EngagementLevel
  engagement_score: number // calculated score
}

/**
 * Contact hierarchy (for reporting relationships)
 */
export interface ContactHierarchy {
  contact: Contact
  direct_reports: Contact[]
  reports_to_chain: Contact[] // Array from immediate manager up to top
}
