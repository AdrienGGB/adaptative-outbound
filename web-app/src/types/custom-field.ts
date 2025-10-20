/**
 * Custom Field Types
 * Supports extensible custom data fields for accounts, contacts, and other entities
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type CustomFieldEntityType = 'account' | 'contact' | 'opportunity'

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'url'
  | 'email'
  | 'phone'
  | 'textarea'

// ============================================================================
// OPTION TYPES
// ============================================================================

/**
 * Option for select and multi_select field types
 */
export interface CustomFieldOption {
  value: string
  label: string
  color?: string
  order?: number
  is_active?: boolean
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation rules for custom fields
 */
export interface CustomFieldValidationRules {
  // String validation
  min_length?: number
  max_length?: number
  pattern?: string // regex pattern

  // Number validation
  min?: number
  max?: number
  step?: number

  // Date validation
  min_date?: string
  max_date?: string

  // Array validation (for multi_select)
  min_items?: number
  max_items?: number

  // Custom validation message
  error_message?: string

  // Other constraints
  allowed_values?: string[]
  disallowed_values?: string[]
}

// ============================================================================
// MAIN CUSTOM FIELD INTERFACE
// ============================================================================

export interface CustomField {
  id: string
  workspace_id: string

  // Field Definition
  entity_type: CustomFieldEntityType
  field_name: string // internal name (snake_case)
  field_label: string // display name
  field_type: CustomFieldType

  // Configuration
  is_required: boolean
  is_unique: boolean
  is_searchable: boolean

  // For select/multi_select types
  options: CustomFieldOption[] | null

  // Validation Rules
  validation_rules: CustomFieldValidationRules | null

  // Display
  display_order: number
  is_visible: boolean
  help_text: string | null
  placeholder: string | null

  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// CREATE TYPE
// ============================================================================

/**
 * Type for creating a new custom field
 */
export type CustomFieldCreate = Omit<
  CustomField,
  'id' | 'created_at' | 'updated_at'
> & {
  workspace_id: string
  entity_type: CustomFieldEntityType
  field_name: string
  field_label: string
  field_type: CustomFieldType
}

// ============================================================================
// UPDATE TYPE
// ============================================================================

/**
 * Type for updating a custom field
 */
export type CustomFieldUpdate = Partial<
  Omit<CustomField, 'id' | 'workspace_id' | 'entity_type' | 'field_name' | 'created_at' | 'updated_at'>
>

// ============================================================================
// CUSTOM FIELD VALUE INTERFACE
// ============================================================================

export interface CustomFieldValue {
  id: string
  custom_field_id: string
  entity_id: string // references account.id, contact.id, etc.

  // Polymorphic value storage
  text_value: string | null
  number_value: number | null
  decimal_value: number | null
  date_value: string | null // ISO 8601 date
  datetime_value: string | null // ISO 8601 timestamp
  boolean_value: boolean | null
  json_value: Record<string, any> | null // for multi_select, arrays, objects

  created_at: string
  updated_at: string
}

// ============================================================================
// VALUE CREATE/UPDATE TYPES
// ============================================================================

/**
 * Type for creating a custom field value
 */
export type CustomFieldValueCreate = Omit<
  CustomFieldValue,
  'id' | 'created_at' | 'updated_at'
> & {
  custom_field_id: string
  entity_id: string
}

/**
 * Type for updating a custom field value
 */
export type CustomFieldValueUpdate = Partial<
  Omit<CustomFieldValue, 'id' | 'custom_field_id' | 'entity_id' | 'created_at' | 'updated_at'>
>

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Custom field with its value for a specific entity
 */
export interface CustomFieldWithValue extends CustomField {
  value: CustomFieldValue | null
  formatted_value?: string | number | boolean | string[] | null
}

/**
 * Typed custom field value (infers type from field_type)
 */
export type TypedCustomFieldValue<T extends CustomFieldType> =
  T extends 'text' | 'url' | 'email' | 'phone' | 'textarea' ? string :
  T extends 'number' ? number :
  T extends 'decimal' ? number :
  T extends 'date' ? string :
  T extends 'datetime' ? string :
  T extends 'boolean' ? boolean :
  T extends 'select' ? string :
  T extends 'multi_select' ? string[] :
  any

/**
 * Custom field grouped by entity type
 */
export interface CustomFieldsByEntity {
  account: CustomField[]
  contact: CustomField[]
  opportunity: CustomField[]
}

/**
 * Custom field value map (for easy access by field name)
 */
export type CustomFieldValueMap = Record<string, {
  field: CustomField
  value: CustomFieldValue | null
  formatted: string | number | boolean | string[] | null
}>

/**
 * Custom field definition for forms
 */
export interface CustomFieldFormField extends CustomField {
  // Additional properties for form rendering
  input_type: 'text' | 'textarea' | 'number' | 'date' | 'datetime-local' | 'checkbox' | 'select' | 'multi-select' | 'url' | 'email' | 'tel'
  default_value?: any
  validation_pattern?: string
  validation_message?: string
}

/**
 * Custom field filter
 */
export interface CustomFieldFilter {
  field_id: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in'
  value: any
}

/**
 * Bulk custom field value update
 */
export interface BulkCustomFieldValueUpdate {
  entity_ids: string[]
  custom_field_id: string
  value: any
}

/**
 * Custom field validation result
 */
export interface CustomFieldValidationResult {
  is_valid: boolean
  errors: Array<{
    field_id: string
    field_name: string
    message: string
  }>
}

/**
 * Custom field statistics
 */
export interface CustomFieldStats {
  field_id: string
  field_name: string
  field_type: CustomFieldType
  entity_type: CustomFieldEntityType

  // Usage stats
  total_values: number
  unique_values: number
  empty_values: number
  fill_rate: number // percentage

  // Value distribution (for select/multi_select)
  value_distribution?: Record<string, number>

  // Number statistics
  min_value?: number
  max_value?: number
  avg_value?: number

  // Date statistics
  earliest_date?: string
  latest_date?: string
}

/**
 * Custom field import/export format
 */
export interface CustomFieldExport {
  field_name: string
  field_label: string
  field_type: CustomFieldType
  entity_type: CustomFieldEntityType
  is_required: boolean
  is_unique: boolean
  options?: CustomFieldOption[]
  validation_rules?: CustomFieldValidationRules
  display_order: number
  help_text?: string
}

/**
 * Custom field template (predefined field configurations)
 */
export interface CustomFieldTemplate {
  id: string
  name: string
  description: string
  entity_type: CustomFieldEntityType
  fields: Omit<CustomFieldCreate, 'workspace_id' | 'created_by' | 'entity_type'>[]
  category?: string
  is_system?: boolean
}

// ============================================================================
// COMMON CUSTOM FIELD TEMPLATES
// ============================================================================

export const COMMON_ACCOUNT_FIELDS: CustomFieldTemplate = {
  id: 'common_account_fields',
  name: 'Common Account Fields',
  description: 'Frequently used custom fields for accounts',
  entity_type: 'account',
  category: 'general',
  fields: [
    {
      field_name: 'primary_use_case',
      field_label: 'Primary Use Case',
      field_type: 'textarea',
      is_required: false,
      is_unique: false,
      is_searchable: true,
      options: null,
      validation_rules: null,
      display_order: 1,
      is_visible: true,
      help_text: 'Main use case or problem the account is trying to solve',
      placeholder: 'Describe the primary use case...',
    },
    {
      field_name: 'competitor',
      field_label: 'Current Competitor',
      field_type: 'select',
      is_required: false,
      is_unique: false,
      is_searchable: true,
      options: [
        { value: 'none', label: 'None' },
        { value: 'competitor_a', label: 'Competitor A' },
        { value: 'competitor_b', label: 'Competitor B' },
        { value: 'competitor_c', label: 'Competitor C' },
        { value: 'other', label: 'Other' }
      ],
      validation_rules: null,
      display_order: 2,
      is_visible: true,
      help_text: 'Current solution they are using',
      placeholder: null,
    }
  ]
}

export const COMMON_CONTACT_FIELDS: CustomFieldTemplate = {
  id: 'common_contact_fields',
  name: 'Common Contact Fields',
  description: 'Frequently used custom fields for contacts',
  entity_type: 'contact',
  category: 'general',
  fields: [
    {
      field_name: 'preferred_contact_method',
      field_label: 'Preferred Contact Method',
      field_type: 'select',
      is_required: false,
      is_unique: false,
      is_searchable: false,
      options: [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'any', label: 'Any Method' }
      ],
      validation_rules: null,
      display_order: 1,
      is_visible: true,
      help_text: 'How the contact prefers to be reached',
      placeholder: null,
    },
    {
      field_name: 'interests',
      field_label: 'Interests',
      field_type: 'multi_select',
      is_required: false,
      is_unique: false,
      is_searchable: true,
      options: [
        { value: 'automation', label: 'Automation' },
        { value: 'analytics', label: 'Analytics' },
        { value: 'integration', label: 'Integration' },
        { value: 'security', label: 'Security' },
        { value: 'scalability', label: 'Scalability' }
      ],
      validation_rules: null,
      display_order: 2,
      is_visible: true,
      help_text: 'Topics or features the contact is interested in',
      placeholder: null,
    }
  ]
}
