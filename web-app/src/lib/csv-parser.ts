// CSV Parser Utility
// Handles CSV file parsing, validation, and transformation

import Papa from 'papaparse'
import type {
  ColumnMapping,
  ImportValidationError,
  EntityType,
  FieldDefinition,
} from '@/types/import'
import { getFieldDefinitions } from '@/types/import'

export interface ParsedCSVData {
  headers: string[]
  rows: any[]
  rowCount: number
  previewRows: any[]
  errors: Papa.ParseError[]
}

export interface ValidatedRow {
  data: Record<string, any>
  errors: ImportValidationError[]
  rowNumber: number
  isValid: boolean
}

/**
 * Parse CSV file
 */
export async function parseCSVFile(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as any[]

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          previewRows: rows.slice(0, 5),
          errors: results.errors,
        })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

/**
 * Parse CSV from URL (for job worker)
 */
export async function parseCSVFromURL(url: string): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      download: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as any[]

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          previewRows: rows.slice(0, 5),
          errors: results.errors,
        })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV from URL: ${error.message}`))
      },
    })
  })
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Transform value based on data type
 */
function transformValue(
  value: any,
  dataType: FieldDefinition['dataType']
): any {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const stringValue = String(value).trim()

  switch (dataType) {
    case 'string':
      return stringValue

    case 'number':
      const num = Number(stringValue)
      return isNaN(num) ? null : num

    case 'boolean':
      const lower = stringValue.toLowerCase()
      if (lower === 'true' || lower === '1' || lower === 'yes') return true
      if (lower === 'false' || lower === '0' || lower === 'no') return false
      return null

    case 'date':
      const date = new Date(stringValue)
      return isNaN(date.getTime()) ? null : date.toISOString()

    case 'email':
      return isValidEmail(stringValue) ? stringValue.toLowerCase() : null

    case 'url':
      // Add protocol if missing
      let urlValue = stringValue
      if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://')) {
        urlValue = 'https://' + urlValue
      }
      return isValidURL(urlValue) ? urlValue : stringValue

    default:
      return stringValue
  }
}

/**
 * Validate a single row against mapping and field definitions
 */
export function validateRow(
  row: any,
  rowNumber: number,
  mapping: ColumnMapping[],
  entityType: EntityType
): ValidatedRow {
  const fieldDefs = getFieldDefinitions(entityType)
  const errors: ImportValidationError[] = []
  const data: Record<string, any> = {}

  // Apply column mappings
  mapping.forEach((map) => {
    const csvValue = row[map.csvColumn]
    const fieldDef = fieldDefs.find((f) => f.name === map.dbField)

    if (!fieldDef) return

    // Check required fields
    if (map.required && (csvValue === null || csvValue === undefined || csvValue === '')) {
      errors.push({
        row: rowNumber,
        column: map.csvColumn,
        value: csvValue,
        error: `Required field '${fieldDef.label}' is missing`,
      })
      return
    }

    // Transform and validate value
    const transformedValue = transformValue(csvValue, map.dataType)

    // Validate specific data types
    if (csvValue && transformedValue === null) {
      if (map.dataType === 'email') {
        errors.push({
          row: rowNumber,
          column: map.csvColumn,
          value: csvValue,
          error: `Invalid email format`,
        })
      } else if (map.dataType === 'number') {
        errors.push({
          row: rowNumber,
          column: map.csvColumn,
          value: csvValue,
          error: `Invalid number format`,
        })
      } else if (map.dataType === 'date') {
        errors.push({
          row: rowNumber,
          column: map.csvColumn,
          value: csvValue,
          error: `Invalid date format`,
        })
      }
    }

    data[map.dbField] = transformedValue
  })

  return {
    data,
    errors,
    rowNumber,
    isValid: errors.length === 0,
  }
}

/**
 * Validate all rows in a batch
 */
export function validateBatch(
  rows: any[],
  startIndex: number,
  mapping: ColumnMapping[],
  entityType: EntityType
): ValidatedRow[] {
  return rows.map((row, index) =>
    validateRow(row, startIndex + index + 1, mapping, entityType)
  )
}

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(entityType: EntityType): string {
  const fieldDefs = getFieldDefinitions(entityType)

  // Create header row
  const headers = fieldDefs.map((field) => field.name)

  // Create example row
  const exampleRow = fieldDefs.map((field) => field.example || '')

  // Convert to CSV
  const csv = Papa.unparse({
    fields: headers,
    data: [exampleRow],
  })

  return csv
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(entityType: EntityType, filename: string) {
  const csv = generateCSVTemplate(entityType)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Convert validated rows to entity creation format
 */
export function prepareForImport(
  validatedRows: ValidatedRow[],
  workspaceId: string
): any[] {
  return validatedRows
    .filter((row) => row.isValid)
    .map((row) => ({
      ...row.data,
      workspace_id: workspaceId,
    }))
}

/**
 * Split array into batches
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}
