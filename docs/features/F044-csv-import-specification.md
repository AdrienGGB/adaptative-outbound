# F044-B: CSV Import & Bulk Data Management

**Feature ID**: F044-B (Extension of F044 Data Pipeline)
**Status**: Planning
**Priority**: High
**Dependencies**: F044-A (Background Job Queue - Must be complete)

---

## Overview

CSV Import allows users to bulk import accounts and contacts from CSV files, with intelligent column mapping, validation, deduplication, and optional auto-enrichment via Apollo.io. This feature leverages the F044 job queue system for processing large imports asynchronously.

---

## User Stories

### US-1: Basic CSV Upload
**As a** workspace admin
**I want to** upload a CSV file of accounts or contacts
**So that** I can quickly populate my CRM with existing data

**Acceptance Criteria**:
- Upload CSV files up to 10MB (configurable)
- Support both accounts and contacts imports
- Drag & drop or file picker interface
- Immediate validation of file format
- Show file preview (first 5-10 rows)

### US-2: Column Mapping
**As a** user uploading a CSV
**I want to** map CSV columns to database fields
**So that** my data is imported correctly regardless of CSV structure

**Acceptance Criteria**:
- Visual column mapping interface
- Auto-detect common column names (email, name, phone, etc.)
- Show sample data for each column
- Mark required fields clearly
- Support custom field mapping
- Save mapping templates for reuse

### US-3: Data Validation
**As a** user
**I want to** see validation errors before importing
**So that** I can fix issues in my source data

**Acceptance Criteria**:
- Validate email formats
- Check for duplicate records (within CSV and against existing data)
- Validate required fields
- Show row-by-row error report
- Allow skipping invalid rows or canceling import
- Display validation summary (X valid, Y errors)

### US-4: Bulk Import Execution
**As a** user
**I want to** import validated data in the background
**So that** I can continue working while large imports process

**Acceptance Criteria**:
- Create background job for import
- Show real-time progress (X of Y rows imported)
- Handle large files (10,000+ rows) without timeout
- Batch insert operations (100-500 rows at a time)
- Navigate away during import without interruption

### US-5: Auto-Enrichment
**As a** user
**I want to** automatically enrich imported records
**So that** I get complete data without manual work

**Acceptance Criteria**:
- Option to "Enrich after import" checkbox
- Create enrichment jobs for imported records
- Respect workspace credit limits
- Show enrichment progress separately
- Skip enrichment if API key not configured

### US-6: Import History
**As a** workspace admin
**I want to** view past imports and their results
**So that** I can track data sources and troubleshoot issues

**Acceptance Criteria**:
- List of all imports with status
- View import details (file name, rows, errors)
- Download error report for failed rows
- Re-import failed rows
- Delete/rollback imports

---

## Technical Architecture

### Database Schema

#### New Tables

```sql
-- Import jobs tracking
CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Import metadata
  import_type TEXT NOT NULL CHECK (import_type IN ('accounts', 'contacts')),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- bytes
  file_url TEXT, -- Supabase Storage URL

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Uploaded, awaiting processing
    'validating',   -- Running validation
    'validated',    -- Validation complete, ready to import
    'importing',    -- Inserting records
    'completed',    -- Successfully completed
    'failed',       -- Import failed
    'partial'       -- Completed with errors
  )),

  -- Configuration
  column_mapping JSONB NOT NULL, -- { "csv_column": "db_field" }
  options JSONB DEFAULT '{}', -- { auto_enrich: true, skip_duplicates: true, etc. }

  -- Results
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,

  -- Validation results
  validation_errors JSONB DEFAULT '[]', -- Array of { row, field, error }

  -- Job reference
  job_id UUID REFERENCES jobs(id), -- Background job processing this import

  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  progress_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imported records tracking (for rollback capability)
CREATE TABLE import_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,

  -- Record reference
  record_type TEXT NOT NULL CHECK (record_type IN ('account', 'contact')),
  record_id UUID NOT NULL, -- ID of created account/contact

  -- Source data
  csv_row_number INTEGER NOT NULL,
  csv_data JSONB NOT NULL, -- Original CSV row data

  -- Status
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN (
    'imported',    -- Successfully imported
    'skipped',     -- Skipped (duplicate, validation error)
    'enriched',    -- Imported and enriched
    'error'        -- Import failed
  )),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_imports_workspace_id ON imports(workspace_id);
CREATE INDEX idx_imports_status ON imports(status);
CREATE INDEX idx_imports_created_at ON imports(created_at DESC);
CREATE INDEX idx_imports_created_by ON imports(created_by);
CREATE INDEX idx_import_records_import_id ON import_records(import_id);
CREATE INDEX idx_import_records_record ON import_records(record_type, record_id);

-- RLS Policies
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view imports in their workspace"
  ON imports FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create imports in their workspace"
  ON imports FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update imports in their workspace"
  ON imports FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view import records in their workspace"
  ON import_records FOR SELECT
  USING (import_id IN (
    SELECT id FROM imports
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  ));
```

#### New Job Types

Add to existing `jobs` table job_type enum:
- `import_accounts` - Process account CSV import
- `import_contacts` - Process contact CSV import
- `validate_import` - Validate CSV data before import
- `bulk_enrich` - Enrich multiple records from import

---

## Frontend Implementation

### 1. Import Page (`/app/imports/page.tsx`)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Imports                              [+ New Import] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Recent Imports                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ accounts_2024.csv                         │ │
│  │ 1,234 rows • 1,200 imported • 34 errors   │ │
│  │ Completed 2 hours ago      [View Details] │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ contacts_jan.csv                          │ │
│  │ 567 rows • Processing... (45%)            │ │
│  │ Started 5 minutes ago         [View Log]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features**:
- List all imports with status badges
- Quick stats (rows, success, errors)
- Filter by status, type, date
- Search by filename
- Actions: View details, Download errors, Retry, Delete

### 2. New Import Flow (`/app/imports/new/page.tsx`)

**Step 1: Upload**
```
┌─────────────────────────────────────────────────┐
│ Import Accounts                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Radio] Import Accounts                        │
│  [Radio] Import Contacts                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │                                           │ │
│  │       📄 Drag & drop CSV file here        │ │
│  │          or click to browse               │ │
│  │                                           │ │
│  │     Supported: .csv, max 10MB             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                         [Cancel]    [Continue] │
└─────────────────────────────────────────────────┘
```

**Step 2: Column Mapping**
```
┌─────────────────────────────────────────────────┐
│ Map Columns                          [Back] [Next] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Preview (First 5 rows)                         │
│  ┌─────────┬──────────┬─────────┬──────────┐   │
│  │ Name    │ Email    │ Phone   │ Company  │   │
│  ├─────────┼──────────┼─────────┼──────────┤   │
│  │ John    │ j@...    │ 555-... │ Acme     │   │
│  └─────────┴──────────┴─────────┴──────────┘   │
│                                                 │
│  Column Mapping                                 │
│  CSV Column          →    Database Field        │
│  ┌─────────────────┐     ┌──────────────────┐  │
│  │ Name            │  →  │ name          ▼  │  │
│  └─────────────────┘     └──────────────────┘  │
│  ┌─────────────────┐     ┌──────────────────┐  │
│  │ Email           │  →  │ email         ▼  │  │
│  └─────────────────┘     └──────────────────┘  │
│  ┌─────────────────┐     ┌──────────────────┐  │
│  │ Phone           │  →  │ phone         ▼  │  │
│  └─────────────────┘     └──────────────────┘  │
│  ┌─────────────────┐     ┌──────────────────┐  │
│  │ Company         │  →  │ company       ▼  │  │
│  └─────────────────┘     └──────────────────┘  │
│                                                 │
│  ☑ Save this mapping as "Default Accounts"     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Step 3: Options & Validation**
```
┌─────────────────────────────────────────────────┐
│ Import Options                      [Back] [Import] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Duplicate Handling                             │
│  [Radio] Skip duplicates (match by email)       │
│  [Radio] Update existing records                │
│  [Radio] Import as new (allow duplicates)       │
│                                                 │
│  Enrichment                                     │
│  ☑ Auto-enrich imported records                 │
│     Uses Apollo.io credits (1 per record)       │
│                                                 │
│  Validation Results                             │
│  ┌───────────────────────────────────────────┐ │
│  │ ✓ 1,234 valid rows                        │ │
│  │ ⚠ 15 warnings (missing optional fields)   │ │
│  │ ✗ 5 errors (invalid email format)         │ │
│  │                                           │ │
│  │ [View All Errors]                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ☑ Import valid rows and skip errors           │
│                                                 │
│                               [Cancel] [Import] │
└─────────────────────────────────────────────────┘
```

**Step 4: Processing**
```
┌─────────────────────────────────────────────────┐
│ Importing accounts_2024.csv                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Processing...                                  │
│  ████████████████░░░░░░░░░░░░ 67%              │
│                                                 │
│  820 of 1,229 rows imported                     │
│  Elapsed: 00:01:23 • Est. remaining: 00:00:45   │
│                                                 │
│  You can leave this page. Import will          │
│  continue in the background.                    │
│                                                 │
│                    [View in Jobs] [Stay Here]   │
└─────────────────────────────────────────────────┘
```

### 3. Import Detail Page (`/app/imports/[id]/page.tsx`)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ accounts_2024.csv                [Retry] [Delete] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: ✓ Completed with warnings              │
│  Type: Accounts                                 │
│  Uploaded: Jan 15, 2024 10:30 AM                │
│  Duration: 2m 34s                               │
│                                                 │
│  Results                                        │
│  ┌─────────────────┬───────────────────────┐   │
│  │ Total Rows      │ 1,234                 │   │
│  │ Imported        │ 1,200  (97%)          │   │
│  │ Skipped         │ 29     (2%)           │   │
│  │ Errors          │ 5      (1%)           │   │
│  └─────────────────┴───────────────────────┘   │
│                                                 │
│  [Download Full Report] [Download Errors CSV]   │
│                                                 │
│  Error Log                                      │
│  ┌───────────────────────────────────────────┐ │
│  │ Row 45: Invalid email format (john.com)   │ │
│  │ Row 78: Missing required field: name      │ │
│  │ Row 156: Duplicate email (skip mode)      │ │
│  │ ... 2 more errors                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Enrichment Status                              │
│  1,200 records queued for enrichment            │
│  [View Enrichment Jobs →]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Components

**`ImportUploader.tsx`**
- Drag & drop zone
- File validation
- CSV preview
- Props: `onUpload`, `importType`, `maxSize`

**`ColumnMapper.tsx`**
- Column mapping interface
- Auto-detection logic
- Template management
- Props: `columns`, `fields`, `onMap`, `suggestions`

**`ImportProgress.tsx`**
- Real-time progress bar
- Row count updates
- ETA calculation
- Props: `importId`, `onComplete`

**`ImportHistory.tsx`**
- Filterable import list
- Status badges
- Quick actions
- Props: `workspaceId`, `limit`

---

## Backend Implementation

### 1. API Routes

**`/api/imports/route.ts`**
```typescript
// POST - Create new import (upload file, validate)
// GET - List imports for workspace
```

**`/api/imports/[id]/route.ts`**
```typescript
// GET - Get import details + records
// DELETE - Delete import and rollback
// PATCH - Update import status/config
```

**`/api/imports/[id]/validate/route.ts`**
```typescript
// POST - Run validation on uploaded file
```

**`/api/imports/[id]/execute/route.ts`**
```typescript
// POST - Start import execution (creates job)
```

**`/api/imports/[id]/download-errors/route.ts`**
```typescript
// GET - Download CSV of error rows
```

**`/api/imports/[id]/retry/route.ts`**
```typescript
// POST - Retry failed/error rows
```

**`/api/imports/templates/route.ts`**
```typescript
// GET - List saved mapping templates
// POST - Save new mapping template
```

**`/api/uploads/csv/route.ts`**
```typescript
// POST - Upload CSV to Supabase Storage
// Returns: file_url, file_name, file_size
```

### 2. Services (`/services/imports.ts`)

```typescript
export interface Import {
  id: string
  workspace_id: string
  created_by: string
  import_type: 'accounts' | 'contacts'
  file_name: string
  file_size: number
  file_url: string
  status: ImportStatus
  column_mapping: Record<string, string>
  options: ImportOptions
  total_rows: number
  valid_rows: number
  invalid_rows: number
  imported_rows: number
  skipped_rows: number
  error_rows: number
  validation_errors: ValidationError[]
  job_id?: string
  progress_percentage: number
  progress_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export type ImportStatus =
  | 'pending'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'partial'

export interface ImportOptions {
  auto_enrich?: boolean
  skip_duplicates?: boolean
  update_existing?: boolean
  duplicate_match_field?: string // 'email' | 'domain' | 'phone'
}

export interface ValidationError {
  row: number
  field: string
  value: any
  error: string
  severity: 'error' | 'warning'
}

export interface ColumnMapping {
  csv_column: string
  db_field: string
  required: boolean
  transform?: string // 'uppercase' | 'lowercase' | 'trim' | etc.
}

// Functions
export async function createImport(data: CreateImportInput): Promise<Import>
export async function getImports(workspaceId: string, filters?: ImportFilters): Promise<Import[]>
export async function getImportById(importId: string): Promise<Import & { records: ImportRecord[] }>
export async function validateImport(importId: string): Promise<ValidationResult>
export async function executeImport(importId: string): Promise<Job>
export async function deleteImport(importId: string): Promise<void>
export async function downloadErrorsCsv(importId: string): Promise<Blob>
export async function retryImport(importId: string, errorRowsOnly?: boolean): Promise<Import>
export async function saveMapping(template: MappingTemplate): Promise<MappingTemplate>
export async function getMappingTemplates(workspaceId: string, type: 'accounts' | 'contacts'): Promise<MappingTemplate[]>
```

### 3. CSV Processing Utilities (`/lib/csv-processor.ts`)

```typescript
export class CsvProcessor {
  /**
   * Parse CSV file and return structured data
   */
  static async parseCsv(fileUrl: string): Promise<{
    headers: string[]
    rows: Record<string, any>[]
    rowCount: number
  }>

  /**
   * Auto-detect column mappings based on headers
   */
  static detectColumnMapping(
    headers: string[],
    targetFields: Field[]
  ): ColumnMapping[]

  /**
   * Validate CSV data against schema
   */
  static validateData(
    rows: Record<string, any>[],
    mapping: ColumnMapping[],
    schema: ValidationSchema
  ): ValidationResult

  /**
   * Transform CSV row to database record
   */
  static transformRow(
    row: Record<string, any>,
    mapping: ColumnMapping[]
  ): Record<string, any>

  /**
   * Check for duplicates
   */
  static async findDuplicates(
    rows: Record<string, any>[],
    workspaceId: string,
    matchField: string,
    recordType: 'accounts' | 'contacts'
  ): Promise<DuplicateMatch[]>

  /**
   * Generate error CSV
   */
  static generateErrorCsv(
    rows: Record<string, any>[],
    errors: ValidationError[]
  ): string
}
```

### 4. Background Job Workers (`/workers/import-worker.ts`)

```typescript
/**
 * Import job processor
 * Polls for import jobs and executes them
 */
export class ImportWorker {
  /**
   * Process import_accounts job
   */
  async processAccountImport(job: Job): Promise<void> {
    // 1. Load import record
    // 2. Download CSV from Supabase Storage
    // 3. Parse CSV
    // 4. Transform rows using column mapping
    // 5. Batch insert accounts (100-500 at a time)
    // 6. Update progress after each batch
    // 7. Track imported records in import_records table
    // 8. Handle duplicates based on options
    // 9. Log errors to job_logs
    // 10. Update import status
    // 11. Create bulk_enrich job if auto_enrich enabled
  }

  /**
   * Process import_contacts job
   */
  async processContactImport(job: Job): Promise<void> {
    // Similar to processAccountImport
  }

  /**
   * Process validate_import job
   */
  async processValidation(job: Job): Promise<void> {
    // 1. Load CSV
    // 2. Run validation rules
    // 3. Check for duplicates
    // 4. Update import with validation_errors
    // 5. Set status to 'validated' or 'failed'
  }

  /**
   * Process bulk_enrich job
   */
  async processBulkEnrich(job: Job): Promise<void> {
    // 1. Get list of record IDs from payload
    // 2. Create individual enrich_account/enrich_contact jobs
    // 3. Respect rate limits and credit limits
    // 4. Update progress
  }
}
```

### 5. Validation Rules (`/lib/validation/import-validators.ts`)

```typescript
export const ACCOUNT_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: null,
  },
  domain: {
    required: false,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  },
  website: {
    required: false,
    pattern: /^https?:\/\/.+/,
  },
  industry: {
    required: false,
    maxLength: 100,
  },
  // ... more fields
}

export const CONTACT_VALIDATION_RULES = {
  first_name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  last_name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  // ... more fields
}

export function validateRow(
  row: Record<string, any>,
  rules: ValidationRules,
  rowNumber: number
): ValidationError[]
```

---

## File Upload & Storage

### Supabase Storage Setup

**Bucket**: `imports`

**Structure**:
```
imports/
  {workspace_id}/
    {import_id}/
      original.csv          # Original uploaded file
      errors.csv            # Generated error file (if any)
```

**Policies**:
```sql
-- Users can upload to their workspace folder
CREATE POLICY "Users can upload import files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can read their workspace files
CREATE POLICY "Users can read import files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Files auto-delete after 30 days
CREATE POLICY "Auto-delete old import files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'imports'
    AND created_at < NOW() - INTERVAL '30 days'
  );
```

### Upload Flow

1. **Frontend**: User selects CSV file
2. **Frontend**: Upload to `/api/uploads/csv` with multipart/form-data
3. **API**: Validate file (size, extension, MIME type)
4. **API**: Upload to Supabase Storage `imports/{workspace_id}/{uuid}/original.csv`
5. **API**: Create `imports` record with file metadata
6. **API**: Return import ID and file URL
7. **Frontend**: Proceed to column mapping step

---

## Column Mapping Intelligence

### Auto-Detection Algorithm

```typescript
const FIELD_PATTERNS: Record<string, string[]> = {
  // Account fields
  name: ['name', 'company', 'company_name', 'business_name', 'organization'],
  domain: ['domain', 'website_domain', 'company_domain'],
  website: ['website', 'url', 'site', 'web'],
  industry: ['industry', 'sector', 'vertical'],
  employee_count: ['employees', 'employee_count', 'company_size', 'size'],
  revenue: ['revenue', 'annual_revenue', 'arr'],

  // Contact fields
  first_name: ['first_name', 'firstname', 'first', 'fname', 'given_name'],
  last_name: ['last_name', 'lastname', 'last', 'lname', 'surname', 'family_name'],
  email: ['email', 'email_address', 'mail', 'e-mail'],
  phone: ['phone', 'phone_number', 'tel', 'telephone', 'mobile'],
  title: ['title', 'job_title', 'position', 'role'],

  // Address fields
  street_address: ['address', 'street', 'street_address', 'address_line_1'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  postal_code: ['zip', 'postal_code', 'postcode', 'zipcode'],
  country: ['country', 'country_name'],
}

function autoDetectMapping(csvHeaders: string[]): ColumnMapping[] {
  return csvHeaders.map(header => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, '_')

    // Find best match
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (patterns.includes(normalizedHeader)) {
        return { csv_column: header, db_field: field, confidence: 1.0 }
      }

      // Fuzzy match
      for (const pattern of patterns) {
        if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
          return { csv_column: header, db_field: field, confidence: 0.8 }
        }
      }
    }

    // No match - let user decide
    return { csv_column: header, db_field: null, confidence: 0 }
  })
}
```

### Mapping Templates

Users can save column mappings as templates for reuse:

```typescript
interface MappingTemplate {
  id: string
  workspace_id: string
  name: string
  import_type: 'accounts' | 'contacts'
  column_mapping: ColumnMapping[]
  created_at: string
}

// Example templates:
// - "HubSpot Export"
// - "Salesforce Accounts"
// - "LinkedIn Contacts"
// - "Default Accounts"
```

---

## Performance Considerations

### Large File Handling

**Challenge**: Processing 50,000+ row CSV files without timeout

**Solution**:
1. **Streaming Upload**: Use multipart upload with progress tracking
2. **Background Processing**: All parsing/validation/import happens in job queue
3. **Batch Operations**: Insert 500 rows at a time with transaction batching
4. **Progress Updates**: Update job progress every 5% or 1000 rows
5. **Chunked Validation**: Validate in chunks to avoid memory overflow

### Optimization Strategies

```typescript
// Batch insert with transaction
async function batchInsertAccounts(
  records: Account[],
  batchSize: number = 500
): Promise<void> {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    await supabase.rpc('batch_insert_accounts', {
      p_accounts: batch,
      p_workspace_id: workspaceId,
    })

    // Update progress
    const progress = Math.round(((i + batchSize) / records.length) * 100)
    await updateJobProgress(jobId, progress)

    // Small delay to avoid rate limits
    await sleep(100)
  }
}
```

**Database Function** (for better performance):
```sql
CREATE OR REPLACE FUNCTION batch_insert_accounts(
  p_accounts JSONB[],
  p_workspace_id UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO accounts (workspace_id, name, domain, website, /* ... */)
  SELECT
    p_workspace_id,
    a->>'name',
    a->>'domain',
    a->>'website',
    /* ... */
  FROM unnest(p_accounts) AS a
  ON CONFLICT (workspace_id, domain)
  DO NOTHING; -- Or UPDATE depending on options
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Error Handling

### Error Types

1. **File Errors**
   - Invalid file format
   - File too large
   - Corrupted CSV
   - Encoding issues

2. **Validation Errors**
   - Missing required fields
   - Invalid data format (email, URL, phone)
   - Data type mismatch
   - Length constraints

3. **Business Logic Errors**
   - Duplicate records
   - Foreign key violations (account_id for contacts)
   - RLS policy violations

4. **System Errors**
   - Database connection issues
   - Storage upload failures
   - Job queue failures

### Error Recovery

```typescript
interface ImportError {
  type: 'file' | 'validation' | 'business' | 'system'
  severity: 'error' | 'warning'
  row?: number
  field?: string
  value?: any
  message: string
  recoverable: boolean
}

// Recoverable errors → allow retry
// Non-recoverable errors → require user action
```

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Invalid email format. Expected: user@example.com',
  MISSING_REQUIRED: 'This field is required and cannot be empty',
  DUPLICATE_RECORD: 'A record with this email already exists',
  DOMAIN_INVALID: 'Invalid domain format. Expected: example.com',
  // ... more friendly messages
}
```

---

## Testing Strategy

### Unit Tests

- CSV parsing and validation
- Column mapping auto-detection
- Data transformation
- Duplicate detection
- Error message generation

### Integration Tests

- File upload to Supabase Storage
- Import job creation and execution
- RLS policy enforcement
- Progress tracking updates
- Error CSV generation

### E2E Tests (Playwright)

1. **Happy Path**: Upload CSV → Map columns → Import → Verify records created
2. **Validation Errors**: Upload invalid CSV → See errors → Fix in UI → Import
3. **Duplicate Handling**: Import CSV with duplicates → Choose skip → Verify
4. **Background Processing**: Start large import → Navigate away → Return → See completed
5. **Auto-Enrichment**: Enable auto-enrich → Import → Verify enrichment jobs created

### Load Testing

- Import 10,000 rows CSV
- Import 50,000 rows CSV
- Import 100,000 rows CSV
- Concurrent imports (5 users)
- Measure: processing time, memory usage, database load

---

## Security Considerations

### File Upload Security

1. **Validation**
   - Check file extension (.csv only)
   - Verify MIME type (text/csv, application/csv)
   - Limit file size (10MB default, configurable)
   - Scan for malicious content (no script tags, etc.)

2. **Storage**
   - Use signed URLs with expiration (24 hours)
   - Store in private bucket with RLS
   - Auto-delete after 30 days
   - No public access

3. **Processing**
   - Sanitize all CSV data before database insert
   - Use parameterized queries (no SQL injection)
   - Respect RLS policies during import
   - Rate limit API endpoints

### Data Privacy

- CSV files contain PII (names, emails, phones)
- Ensure GDPR/CCPA compliance
- Audit log all imports (who, when, what)
- Allow users to delete import history
- Encrypt files at rest (Supabase handles this)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Status**: Not Started
**Tasks**:
- [ ] Create database schema (imports, import_records tables)
- [ ] Set up Supabase Storage bucket with policies
- [ ] Create API routes structure
- [ ] Implement file upload endpoint
- [ ] Build CSV parser utility
- [ ] Write unit tests for CSV processing

**Deliverable**: Can upload CSV and parse it

### Phase 2: Validation & Mapping (Week 2)
**Status**: Not Started
**Tasks**:
- [ ] Implement column mapping auto-detection
- [ ] Build validation engine with rules
- [ ] Create ImportUploader component
- [ ] Create ColumnMapper component
- [ ] Build import options UI
- [ ] Add validation error display

**Deliverable**: Can upload, map columns, and validate

### Phase 3: Import Execution (Week 3)
**Status**: Not Started
**Tasks**:
- [ ] Implement import job worker
- [ ] Build batch insert logic
- [ ] Add duplicate detection
- [ ] Create progress tracking
- [ ] Build ImportProgress component
- [ ] Test with large files (10k+ rows)

**Deliverable**: Can execute imports in background

### Phase 4: History & Management (Week 4)
**Status**: Not Started
**Tasks**:
- [ ] Build import history page
- [ ] Create import detail page
- [ ] Implement error CSV download
- [ ] Add retry functionality
- [ ] Build rollback capability
- [ ] Add import navigation to sidebar

**Deliverable**: Full import management UI

### Phase 5: Auto-Enrichment Integration (Week 5)
**Status**: Not Started
**Tasks**:
- [ ] Integrate with F044-A enrichment jobs
- [ ] Implement bulk_enrich job type
- [ ] Add credit limit checks
- [ ] Build enrichment progress tracking
- [ ] Test end-to-end flow

**Deliverable**: Auto-enrichment works after import

### Phase 6: Polish & Optimization (Week 6)
**Status**: Not Started
**Tasks**:
- [ ] Add mapping templates feature
- [ ] Optimize batch insert performance
- [ ] Improve error messages
- [ ] Add comprehensive error handling
- [ ] Write E2E tests
- [ ] Load testing and optimization
- [ ] Documentation

**Deliverable**: Production-ready CSV import

---

## API Documentation

### POST /api/imports
Create new import

**Request**:
```json
{
  "import_type": "accounts",
  "file_url": "https://...",
  "file_name": "accounts.csv",
  "file_size": 12345
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "pending",
  "file_name": "accounts.csv",
  "total_rows": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /api/imports/{id}/validate
Validate import

**Response**:
```json
{
  "valid_rows": 1200,
  "invalid_rows": 5,
  "warnings": 15,
  "errors": [
    {
      "row": 45,
      "field": "email",
      "value": "invalid",
      "error": "Invalid email format",
      "severity": "error"
    }
  ]
}
```

### POST /api/imports/{id}/execute
Execute import

**Request**:
```json
{
  "column_mapping": {
    "Company Name": "name",
    "Email": "email",
    "Website": "website"
  },
  "options": {
    "skip_duplicates": true,
    "auto_enrich": true,
    "duplicate_match_field": "email"
  }
}
```

**Response**:
```json
{
  "job_id": "uuid",
  "import_id": "uuid",
  "status": "importing"
}
```

### GET /api/imports/{id}
Get import details

**Response**:
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "import_type": "accounts",
  "file_name": "accounts.csv",
  "status": "completed",
  "total_rows": 1234,
  "imported_rows": 1200,
  "skipped_rows": 29,
  "error_rows": 5,
  "progress_percentage": 100,
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:32:34Z",
  "validation_errors": [...],
  "job_id": "uuid"
}
```

---

## Success Metrics

### Performance Metrics
- Import processing time: < 30 seconds per 1000 rows
- Validation time: < 10 seconds per 1000 rows
- UI responsiveness: All actions < 200ms
- File upload: Support up to 100MB files

### Quality Metrics
- Auto-detection accuracy: > 90% for common CSV formats
- Error detection rate: 100% of invalid data caught
- Zero data loss during import
- Successful rollback capability

### User Experience Metrics
- Time to complete first import: < 3 minutes
- User satisfaction with column mapping: > 4.5/5
- Error message clarity: > 4/5
- Feature adoption rate: > 70% of users import within first week

---

## Future Enhancements

### v2 Features (Post-MVP)
- [ ] Import from Google Sheets (live sync)
- [ ] Import from URLs (fetch CSV from web)
- [ ] Schedule recurring imports
- [ ] Import templates marketplace
- [ ] Excel (.xlsx) file support
- [ ] Multi-sheet Excel import
- [ ] Custom field mapping transforms (e.g., split full name)
- [ ] Import preview with data quality score
- [ ] Webhook notifications on import completion
- [ ] Export templates (reverse mapping)

### Advanced Features
- [ ] AI-powered column mapping suggestions
- [ ] Data enrichment during import (not just after)
- [ ] Import conflict resolution UI
- [ ] Merge duplicate records (not just skip)
- [ ] Import from Salesforce/HubSpot directly
- [ ] Real-time collaboration (multiple users mapping same file)
- [ ] Import history analytics dashboard

---

## Dependencies

### NPM Packages

```json
{
  "papaparse": "^5.4.1",          // CSV parsing
  "@types/papaparse": "^5.3.11",  // TypeScript types
  "file-saver": "^2.0.5",         // Download error CSV
  "react-dropzone": "^14.2.3",    // Drag & drop upload
  "zod": "^3.22.4"                // Validation schemas (already installed)
}
```

### Supabase Features
- Storage (already configured)
- Database functions (for batch operations)
- RLS policies (already using)
- Realtime (for progress updates - already using)

---

## Questions & Decisions Needed

1. **File Size Limit**: 10MB default - increase for enterprise users?
2. **Retention Policy**: Delete CSV files after 30 days - configurable?
3. **Rate Limiting**: How many concurrent imports per workspace?
4. **Credit Limits**: Block import if auto-enrich would exceed credits?
5. **Duplicate Strategy**: Default to skip, update, or ask user?
6. **Mapping Templates**: Share across workspace or per-user?
7. **Rollback**: Full delete or soft delete with undo period?
8. **Notifications**: Email when large import completes?

---

## Conclusion

This CSV import feature completes the F044 Data Pipeline by providing a robust way to bulk load data into the system. By leveraging the existing job queue infrastructure, it ensures scalable, reliable imports while maintaining data integrity and user control.

The phased implementation approach allows for incremental delivery and testing, with the MVP (Phases 1-4) providing core functionality and later phases adding polish and advanced features.
