/**
 * Account Types
 * Represents companies/organizations in the CRM
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type AccountStatus = 'active' | 'archived' | 'merged' | 'duplicate'
export type AccountTier = 'enterprise' | 'mid-market' | 'smb' | 'startup'
export type LifecycleStage = 'target' | 'engaged' | 'opportunity' | 'customer' | 'churned'
export type BusinessModel = 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace'
export type CompanyType = 'Public' | 'Private' | 'Non-profit' | 'Government'
export type FundingStage = 'Bootstrapped' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'IPO' | 'Acquired'
export type FundingType = 'Seed' | 'Series A' | 'Venture' | 'Private Equity' | 'Debt'
export type EmployeeRange = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5000+'
export type RevenueRange = '$0-$1M' | '$1M-$10M' | '$10M-$50M' | '$50M-$100M' | '$100M-$500M' | '$500M+'
export type AccountSource = 'import' | 'crm_sync' | 'manual' | 'enrichment' | 'web_form'

// ============================================================================
// TECHNOLOGY STACK TYPE
// ============================================================================

/**
 * Technology stack organized by category
 * Example: {"crm": ["Salesforce"], "marketing": ["HubSpot", "Marketo"]}
 */
export type TechnologyStack = Record<string, string[]>

// ============================================================================
// MAIN ACCOUNT INTERFACE
// ============================================================================

export interface Account {
  // Identity
  id: string
  workspace_id: string
  external_id: string | null

  // Basic Information
  name: string
  domain: string | null
  website: string | null
  description: string | null
  logo_url: string | null

  // Firmographics
  industry: string | null
  sub_industry: string | null
  employee_count: number | null
  employee_range: EmployeeRange | null
  annual_revenue: number | null // in cents
  revenue_range: RevenueRange | null

  // Location
  headquarters_address: string | null
  headquarters_city: string | null
  headquarters_state: string | null
  headquarters_country: string | null // ISO 3166-1 alpha-2 code
  headquarters_postal_code: string | null
  headquarters_timezone: string | null
  latitude: number | null
  longitude: number | null

  // Business Details
  founded_year: number | null
  business_model: BusinessModel | null
  company_type: CompanyType | null
  stock_ticker: string | null
  naics_code: string | null // North American Industry Classification System
  sic_code: string | null // Standard Industrial Classification

  // Financial Signals
  funding_stage: FundingStage | null
  funding_total: number | null // total raised in cents
  last_funding_date: string | null // ISO 8601 date
  last_funding_amount: number | null
  last_funding_type: FundingType | null
  investors: string[] | null // array of investor names

  // Technology Stack
  technologies: TechnologyStack
  tech_stack_last_updated: string | null

  // Social & Web Presence
  linkedin_url: string | null
  linkedin_id: string | null
  twitter_handle: string | null
  twitter_url: string | null
  facebook_url: string | null
  crunchbase_url: string | null
  github_url: string | null

  // Status & Classification
  status: AccountStatus
  account_tier: AccountTier | null
  lifecycle_stage: LifecycleStage | null

  // Ownership & Assignment
  owner_id: string | null
  assigned_team_id: string | null

  // Parent/Child Relationships
  parent_account_id: string | null
  ultimate_parent_id: string | null

  // Computed/Cached Fields
  contact_count: number
  activity_count: number
  open_opportunity_count: number

  // Metadata
  source: AccountSource | null
  created_by: string | null
  created_at: string
  updated_at: string
  last_activity_at: string | null
  last_enriched_at: string | null

  // Search vector (excluded from create/update operations)
  search_vector?: unknown
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new account
 * Excludes auto-generated fields and computed fields
 */
export type AccountCreate = Omit<
  Account,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'search_vector'
  | 'contact_count'
  | 'activity_count'
  | 'open_opportunity_count'
> & {
  workspace_id: string
  name: string
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating an account
 * All fields are optional except ID and workspace_id
 */
export type AccountUpdate = Partial<
  Omit<
    Account,
    | 'id'
    | 'workspace_id'
    | 'created_at'
    | 'updated_at'
    | 'search_vector'
    | 'contact_count'
    | 'activity_count'
    | 'open_opportunity_count'
  >
>

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Common filters for querying accounts
 */
export interface AccountFilters {
  workspace_id?: string
  status?: AccountStatus | AccountStatus[]
  owner_id?: string | string[]
  assigned_team_id?: string
  industry?: string | string[]
  account_tier?: AccountTier | AccountTier[]
  lifecycle_stage?: LifecycleStage | LifecycleStage[]
  employee_range?: EmployeeRange | EmployeeRange[]
  revenue_range?: RevenueRange | RevenueRange[]
  funding_stage?: FundingStage | FundingStage[]
  business_model?: BusinessModel | BusinessModel[]
  company_type?: CompanyType | CompanyType[]
  headquarters_country?: string | string[]
  headquarters_state?: string | string[]
  headquarters_city?: string | string[]
  parent_account_id?: string | null
  has_parent?: boolean
  domain?: string

  // Date range filters
  created_after?: string
  created_before?: string
  last_activity_after?: string
  last_activity_before?: string

  // Search
  search_query?: string

  // Pagination
  limit?: number
  offset?: number

  // Sorting
  order_by?: keyof Account
  order_direction?: 'asc' | 'desc'
}

// ============================================================================
// ACCOUNT HIERARCHY TYPES
// ============================================================================

export type AccountHierarchyRelationshipType =
  | 'subsidiary'
  | 'division'
  | 'franchise'
  | 'partner'
  | 'acquired'

export interface AccountHierarchy {
  id: string
  workspace_id: string
  child_account_id: string
  parent_account_id: string
  relationship_type: AccountHierarchyRelationshipType
  ownership_percentage: number | null // 0.00 to 100.00
  path: string // ltree path
  depth: number // 0 = direct parent, 1 = grandparent, etc.
  created_at: string
  updated_at: string
}

export type AccountHierarchyCreate = Omit<
  AccountHierarchy,
  'id' | 'created_at' | 'updated_at'
> & {
  workspace_id: string
  child_account_id: string
  parent_account_id: string
}

// ============================================================================
// VERSION/AUDIT TRAIL TYPES
// ============================================================================

export type AccountChangeType = 'created' | 'updated' | 'deleted' | 'restored'
export type AccountChangeSource = 'user_edit' | 'crm_sync' | 'enrichment' | 'import' | 'api'

export interface AccountVersion {
  id: string
  account_id: string
  data: Account // Full account snapshot
  changed_fields: string[]
  change_type: AccountChangeType
  changed_by: string | null
  change_source: AccountChangeSource | null
  change_reason: string | null
  version_number: number
  created_at: string
}

// ============================================================================
// IMPORT MAPPING TYPES
// ============================================================================

export interface ImportAccountMapping {
  id: string
  import_id: string
  account_id: string
  created_at: string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Account with expanded relations
 */
export interface AccountWithRelations extends Account {
  owner?: {
    id: string
    email: string
    full_name: string
  }
  assigned_team?: {
    id: string
    name: string
  }
  parent_account?: Pick<Account, 'id' | 'name' | 'domain'>
  ultimate_parent?: Pick<Account, 'id' | 'name' | 'domain'>
}

/**
 * Minimal account info for lists and dropdowns
 */
export interface AccountListItem {
  id: string
  name: string
  domain: string | null
  logo_url: string | null
  industry: string | null
  employee_range: EmployeeRange | null
  status: AccountStatus
  lifecycle_stage: LifecycleStage | null
  contact_count: number
  last_activity_at: string | null
}

/**
 * Account statistics/metrics
 */
export interface AccountMetrics {
  total_accounts: number
  active_accounts: number
  accounts_by_tier: Record<AccountTier, number>
  accounts_by_lifecycle: Record<LifecycleStage, number>
  accounts_with_activity_last_30_days: number
  average_contacts_per_account: number
}
