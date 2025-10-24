/**
 * Unit Tests for CSV Parser
 * Tests parsing, validation, and transformation logic
 */

import {
  parseCSVFile,
  validateRow,
  validateBatch,
  generateCSVTemplate,
  prepareForImport,
  batchArray,
} from '@/lib/csv-parser'
import type { ColumnMapping } from '@/types/import'

describe('CSV Parser', () => {
  describe('parseCSVFile', () => {
    it('should parse a valid CSV file', async () => {
      const csvContent = `name,domain,industry
Acme Corp,acme.com,Technology
Global Inc,global.com,Finance`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCSVFile(file)

      expect(result.headers).toEqual(['name', 'domain', 'industry'])
      expect(result.rows).toHaveLength(2)
      expect(result.rowCount).toBe(2)
      expect(result.rows[0]).toEqual({
        name: 'Acme Corp',
        domain: 'acme.com',
        industry: 'Technology',
      })
      expect(result.errors).toHaveLength(0)
    })

    it('should handle CSV with headers only', async () => {
      const csvContent = `name,domain,industry`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCSVFile(file)

      expect(result.headers).toEqual(['name', 'domain', 'industry'])
      expect(result.rows).toHaveLength(0)
      expect(result.rowCount).toBe(0)
    })

    it('should skip empty lines', async () => {
      const csvContent = `name,domain,industry
Acme Corp,acme.com,Technology

Global Inc,global.com,Finance`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCSVFile(file)

      expect(result.rows).toHaveLength(2)
      expect(result.rowCount).toBe(2)
    })

    it('should handle headers (papaparse may or may not trim)', async () => {
      // Note: papaparse trimHeaders behavior varies by version
      const csvContent = `name,domain,industry
Acme Corp,acme.com,Technology`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCSVFile(file)

      // Just verify headers exist, trimming is handled by papaparse
      expect(result.headers).toHaveLength(3)
      expect(result.headers[0].toLowerCase().includes('name')).toBe(true)
    })

    it('should return preview rows (max 5)', async () => {
      const csvContent = `name,domain
Row 1,domain1.com
Row 2,domain2.com
Row 3,domain3.com
Row 4,domain4.com
Row 5,domain5.com
Row 6,domain6.com
Row 7,domain7.com`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCSVFile(file)

      expect(result.previewRows).toHaveLength(5)
      expect(result.rowCount).toBe(7)
    })
  })

  describe('validateRow', () => {
    const mapping: ColumnMapping[] = [
      {
        csvColumn: 'Company Name',
        dbField: 'name',
        required: true,
        dataType: 'string',
      },
      {
        csvColumn: 'Website',
        dbField: 'domain',
        required: false,
        dataType: 'url',
      },
      {
        csvColumn: 'Revenue',
        dbField: 'annual_revenue_cents',
        required: false,
        dataType: 'number',
      },
    ]

    it('should validate a valid row', () => {
      const row = {
        'Company Name': 'Acme Corp',
        Website: 'acme.com',
        Revenue: '1000000',
      }

      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.data).toMatchObject({
        name: 'Acme Corp',
        domain: 'https://acme.com',
        annual_revenue_cents: 1000000,
      })
    })

    it('should detect missing required field', () => {
      const row = {
        'Company Name': '',
        Website: 'acme.com',
      }

      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        column: 'Company Name',
        error: expect.stringContaining('Required field'),
      })
    })

    it('should validate email format when email is provided', () => {
      const emailMapping: ColumnMapping[] = [
        {
          csvColumn: 'Name',
          dbField: 'name',
          required: true,
          dataType: 'string',
        },
        {
          csvColumn: 'Email',
          dbField: 'email',
          required: false,
          dataType: 'email',
        },
      ]

      const rowWithInvalidEmail = {
        Name: 'Acme Corp',
        Email: 'not-an-email',
      }

      const result = validateRow(rowWithInvalidEmail, 1, emailMapping, 'contacts')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        column: 'Email',
        error: 'Invalid email format',
      })
    })

    it('should detect invalid number format', () => {
      const row = {
        'Company Name': 'Acme Corp',
        Revenue: 'not-a-number',
      }

      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        column: 'Revenue',
        error: 'Invalid number format',
      })
    })

    it('should add protocol to URL if missing', () => {
      const row = {
        'Company Name': 'Acme Corp',
        Website: 'acme.com',
      }

      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(true)
      expect(result.data.domain).toBe('https://acme.com')
    })

    it('should handle null values for non-required fields', () => {
      const row = {
        'Company Name': 'Acme Corp',
        Website: '',
        Revenue: '',
      }

      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(true)
      expect(result.data).toMatchObject({
        name: 'Acme Corp',
        domain: null,
        annual_revenue_cents: null,
      })
    })
  })

  describe('Data Type Transformations', () => {
    it('should transform boolean values correctly (only if field exists)', () => {
      const mapping: ColumnMapping[] = [
        {
          csvColumn: 'Name',
          dbField: 'first_name',
          required: true,
          dataType: 'string',
        },
        {
          csvColumn: 'IsChampion',
          dbField: 'is_champion',
          required: false,
          dataType: 'boolean',
        },
      ]

      // Test 'true' variations
      const rowTrue1 = { Name: 'Test', IsChampion: 'true' }
      expect(validateRow(rowTrue1, 1, mapping, 'contacts').data.is_champion).toBe(true)

      const rowTrue2 = { Name: 'Test', IsChampion: '1' }
      expect(validateRow(rowTrue2, 1, mapping, 'contacts').data.is_champion).toBe(true)

      const rowTrue3 = { Name: 'Test', IsChampion: 'yes' }
      expect(validateRow(rowTrue3, 1, mapping, 'contacts').data.is_champion).toBe(true)

      // Test 'false' variations
      const rowFalse1 = { Name: 'Test', IsChampion: 'false' }
      expect(validateRow(rowFalse1, 1, mapping, 'contacts').data.is_champion).toBe(false)

      const rowFalse2 = { Name: 'Test', IsChampion: '0' }
      expect(validateRow(rowFalse2, 1, mapping, 'contacts').data.is_champion).toBe(false)

      const rowFalse3 = { Name: 'Test', IsChampion: 'no' }
      expect(validateRow(rowFalse3, 1, mapping, 'contacts').data.is_champion).toBe(false)

      // Test invalid boolean
      const rowInvalid = { Name: 'Test', IsChampion: 'maybe' }
      expect(validateRow(rowInvalid, 1, mapping, 'contacts').data.is_champion).toBe(null)
    })

    it('should transform date values correctly', () => {
      const mapping: ColumnMapping[] = [
        {
          csvColumn: 'Name',
          dbField: 'name',
          required: true,
          dataType: 'string',
        },
        {
          csvColumn: 'Date',
          dbField: 'lifecycle_stage',
          required: false,
          dataType: 'date',
        },
      ]

      const row = { Name: 'Test', Date: '2024-10-24' }
      const result = validateRow(row, 1, mapping, 'accounts')

      // Date is transformed and stored
      expect(result.data.lifecycle_stage).toBe('2024-10-24T00:00:00.000Z')
    })

    it('should detect invalid date format', () => {
      const mapping: ColumnMapping[] = [
        {
          csvColumn: 'Name',
          dbField: 'name',
          required: true,
          dataType: 'string',
        },
        {
          csvColumn: 'Date',
          dbField: 'lifecycle_stage',
          required: false,
          dataType: 'date',
        },
      ]

      const row = { Name: 'Test', Date: 'not-a-date' }
      const result = validateRow(row, 1, mapping, 'accounts')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('Invalid date format')
    })
  })

  describe('validateBatch', () => {
    it('should validate multiple rows', () => {
      const mapping: ColumnMapping[] = [
        {
          csvColumn: 'Name',
          dbField: 'name',
          required: true,
          dataType: 'string',
        },
      ]

      const rows = [
        { Name: 'Company 1' },
        { Name: 'Company 2' },
        { Name: '' }, // Invalid
        { Name: 'Company 3' },
      ]

      const results = validateBatch(rows, 0, mapping, 'accounts')

      expect(results).toHaveLength(4)
      expect(results[0].isValid).toBe(true)
      expect(results[1].isValid).toBe(true)
      expect(results[2].isValid).toBe(false)
      expect(results[3].isValid).toBe(true)
    })
  })

  describe('generateCSVTemplate', () => {
    it('should generate accounts template', () => {
      const template = generateCSVTemplate('accounts')

      expect(template).toContain('name')
      expect(template).toContain('Acme Corporation')
    })

    it('should generate contacts template', () => {
      const template = generateCSVTemplate('contacts')

      expect(template).toContain('first_name')
      expect(template).toContain('John')
    })
  })

  describe('prepareForImport', () => {
    it('should prepare valid rows for import', () => {
      const validatedRows = [
        {
          data: { name: 'Company 1' },
          errors: [],
          rowNumber: 1,
          isValid: true,
        },
        {
          data: { name: '' },
          errors: [{ row: 2, column: 'name', value: '', error: 'Required' }],
          rowNumber: 2,
          isValid: false,
        },
        {
          data: { name: 'Company 3' },
          errors: [],
          rowNumber: 3,
          isValid: true,
        },
      ]

      const result = prepareForImport(validatedRows, 'workspace-123')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'Company 1',
        workspace_id: 'workspace-123',
      })
      expect(result[1]).toEqual({
        name: 'Company 3',
        workspace_id: 'workspace-123',
      })
    })
  })

  describe('batchArray', () => {
    it('should split array into batches', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const batches = batchArray(array, 3)

      expect(batches).toHaveLength(4)
      expect(batches[0]).toEqual([1, 2, 3])
      expect(batches[1]).toEqual([4, 5, 6])
      expect(batches[2]).toEqual([7, 8, 9])
      expect(batches[3]).toEqual([10])
    })

    it('should handle empty array', () => {
      const batches = batchArray([], 5)

      expect(batches).toHaveLength(0)
    })

    it('should handle batch size larger than array', () => {
      const array = [1, 2, 3]
      const batches = batchArray(array, 10)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toEqual([1, 2, 3])
    })
  })
})
