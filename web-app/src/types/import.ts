// Import-related types for CSV import functionality

export type EntityType = 'accounts' | 'contacts' | 'tasks'

export interface ColumnMapping {
  csvColumn: string
  dbField: string
  required: boolean
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url'
}

export interface ImportOptions {
  entityType: EntityType
  updateExisting: boolean
  skipDuplicates: boolean
  batchSize: number
}

export interface ImportMetadata {
  fileName: string
  fileSize: number
  rowCount: number
  headers: string[]
  uploadedAt: string
  fileUrl: string
}

export interface ImportValidationError {
  row: number
  column: string
  value: any
  error: string
}

export interface ImportResult {
  total: number
  successful: number
  failed: number
  skipped: number
  errors: ImportValidationError[]
}

export interface ImportJobPayload {
  fileUrl: string
  entityType: EntityType
  mapping: ColumnMapping[]
  options: ImportOptions
  metadata: ImportMetadata
}

export interface ImportProgress {
  total: number
  processed: number
  successful: number
  failed: number
  percentage: number
  currentBatch: number
  message: string
  errors: ImportValidationError[]
}

// Field definitions for mapping UI
export interface FieldDefinition {
  name: string
  label: string
  required: boolean
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url'
  description?: string
  example?: string
}

// Account field mappings
export const ACCOUNT_FIELDS: FieldDefinition[] = [
  {
    name: 'name',
    label: 'Account Name',
    required: true,
    dataType: 'string',
    description: 'Company or organization name',
    example: 'Acme Corporation'
  },
  {
    name: 'domain',
    label: 'Website Domain',
    required: false,
    dataType: 'url',
    description: 'Company website domain',
    example: 'acme.com'
  },
  {
    name: 'industry',
    label: 'Industry',
    required: false,
    dataType: 'string',
    description: 'Primary industry',
    example: 'Technology'
  },
  {
    name: 'employee_range',
    label: 'Employee Range',
    required: false,
    dataType: 'string',
    description: 'Number of employees',
    example: '51-200'
  },
  {
    name: 'annual_revenue_cents',
    label: 'Annual Revenue',
    required: false,
    dataType: 'number',
    description: 'Annual revenue in cents',
    example: '100000000'
  },
  {
    name: 'account_tier',
    label: 'Account Tier',
    required: false,
    dataType: 'string',
    description: 'Account tier (enterprise, mid_market, smb, startup)',
    example: 'enterprise'
  },
  {
    name: 'lifecycle_stage',
    label: 'Lifecycle Stage',
    required: false,
    dataType: 'string',
    description: 'Current lifecycle stage',
    example: 'target'
  },
  {
    name: 'city',
    label: 'City',
    required: false,
    dataType: 'string',
    description: 'City location',
    example: 'San Francisco'
  },
  {
    name: 'state',
    label: 'State/Province',
    required: false,
    dataType: 'string',
    description: 'State or province',
    example: 'CA'
  },
  {
    name: 'country',
    label: 'Country',
    required: false,
    dataType: 'string',
    description: 'Country',
    example: 'United States'
  },
  {
    name: 'description',
    label: 'Description',
    required: false,
    dataType: 'string',
    description: 'Account description or notes',
    example: 'Leading provider of...'
  }
]

// Contact field mappings
export const CONTACT_FIELDS: FieldDefinition[] = [
  {
    name: 'first_name',
    label: 'First Name',
    required: true,
    dataType: 'string',
    description: 'Contact first name',
    example: 'John'
  },
  {
    name: 'last_name',
    label: 'Last Name',
    required: true,
    dataType: 'string',
    description: 'Contact last name',
    example: 'Doe'
  },
  {
    name: 'email',
    label: 'Email',
    required: false,
    dataType: 'email',
    description: 'Primary email address',
    example: 'john.doe@acme.com'
  },
  {
    name: 'phone',
    label: 'Phone',
    required: false,
    dataType: 'string',
    description: 'Primary phone number',
    example: '+1 555-0100'
  },
  {
    name: 'mobile_phone',
    label: 'Mobile Phone',
    required: false,
    dataType: 'string',
    description: 'Mobile phone number',
    example: '+1 555-0101'
  },
  {
    name: 'job_title',
    label: 'Job Title',
    required: false,
    dataType: 'string',
    description: 'Current job title',
    example: 'VP of Sales'
  },
  {
    name: 'department',
    label: 'Department',
    required: false,
    dataType: 'string',
    description: 'Department',
    example: 'Sales'
  },
  {
    name: 'seniority_level',
    label: 'Seniority Level',
    required: false,
    dataType: 'string',
    description: 'Seniority level (C-Level, VP, Director, Manager, Individual Contributor)',
    example: 'VP'
  },
  {
    name: 'linkedin_url',
    label: 'LinkedIn URL',
    required: false,
    dataType: 'url',
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe'
  },
  {
    name: 'is_decision_maker',
    label: 'Decision Maker',
    required: false,
    dataType: 'boolean',
    description: 'Is this person a decision maker?',
    example: 'true'
  },
  {
    name: 'is_champion',
    label: 'Champion',
    required: false,
    dataType: 'boolean',
    description: 'Is this person a champion?',
    example: 'false'
  }
]

// Helper function to get field definitions by entity type
export function getFieldDefinitions(entityType: EntityType): FieldDefinition[] {
  switch (entityType) {
    case 'accounts':
      return ACCOUNT_FIELDS
    case 'contacts':
      return CONTACT_FIELDS
    case 'tasks':
      return []  // TODO: Define task fields
    default:
      return []
  }
}

// Helper function to auto-detect column mappings
export function autoDetectMapping(
  csvHeaders: string[],
  entityType: EntityType
): ColumnMapping[] {
  const fieldDefs = getFieldDefinitions(entityType)
  const mappings: ColumnMapping[] = []

  csvHeaders.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, '_')

    // Try to find exact match
    let matchedField = fieldDefs.find(field =>
      field.name.toLowerCase() === normalizedHeader
    )

    // Try fuzzy matching
    if (!matchedField) {
      matchedField = fieldDefs.find(field => {
        const fieldName = field.name.toLowerCase()
        const label = field.label.toLowerCase().replace(/[_\s-]+/g, '_')
        return normalizedHeader.includes(fieldName) ||
               fieldName.includes(normalizedHeader) ||
               normalizedHeader.includes(label) ||
               label.includes(normalizedHeader)
      })
    }

    if (matchedField) {
      mappings.push({
        csvColumn: header,
        dbField: matchedField.name,
        required: matchedField.required,
        dataType: matchedField.dataType
      })
    }
  })

  return mappings
}
