"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getFieldDefinitions } from '@/types/import'
import type {
  EntityType,
  ColumnMapping as ColumnMappingType,
} from '@/types/import'

interface ColumnMappingProps {
  csvHeaders: string[]
  previewRows: any[]
  mappings: ColumnMappingType[]
  entityType: EntityType
  onMappingsChange: (mappings: ColumnMappingType[]) => void
}

export function ColumnMapping({
  csvHeaders,
  previewRows,
  mappings,
  entityType,
  onMappingsChange,
}: ColumnMappingProps) {
  const fieldDefs = getFieldDefinitions(entityType)

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    const fieldDef = fieldDefs.find((f) => f.name === dbField)
    if (!fieldDef) return

    const existingMapping = mappings.find((m) => m.csvColumn === csvColumn)

    if (existingMapping) {
      // Update existing mapping
      const updated = mappings.map((m) =>
        m.csvColumn === csvColumn
          ? {
              ...m,
              dbField,
              required: fieldDef.required,
              dataType: fieldDef.dataType,
            }
          : m
      )
      onMappingsChange(updated)
    } else {
      // Add new mapping
      onMappingsChange([
        ...mappings,
        {
          csvColumn,
          dbField,
          required: fieldDef.required,
          dataType: fieldDef.dataType,
        },
      ])
    }
  }

  const handleUnmap = (csvColumn: string) => {
    onMappingsChange(mappings.filter((m) => m.csvColumn !== csvColumn))
  }

  const getMappedField = (csvColumn: string) => {
    return mappings.find((m) => m.csvColumn === csvColumn)?.dbField
  }

  const requiredFields = fieldDefs.filter((f) => f.required)
  const mappedRequiredFields = requiredFields.filter((f) =>
    mappings.some((m) => m.dbField === f.name)
  )
  const allRequiredMapped = mappedRequiredFields.length === requiredFields.length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Map Columns</h3>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to database fields
        </p>
      </div>

      {/* Required Fields Status */}
      <div className="flex items-center gap-2">
        <Badge variant={allRequiredMapped ? 'default' : 'destructive'}>
          Required Fields: {mappedRequiredFields.length}/{requiredFields.length}
        </Badge>
        {!allRequiredMapped && (
          <p className="text-sm text-destructive">
            Please map all required fields to continue
          </p>
        )}
      </div>

      {/* Column Mapping Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">CSV Column</th>
              <th className="text-left p-3 text-sm font-medium">Preview</th>
              <th className="text-left p-3 text-sm font-medium">
                Maps To (Database Field)
              </th>
              <th className="text-left p-3 text-sm font-medium">Required</th>
            </tr>
          </thead>
          <tbody>
            {csvHeaders.map((header, index) => {
              const mappedField = getMappedField(header)
              const fieldDef = fieldDefs.find((f) => f.name === mappedField)
              const previewValue = previewRows[0]?.[header]

              return (
                <tr key={index} className="border-t">
                  <td className="p-3">
                    <span className="font-medium text-sm">{header}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {previewValue || '-'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Select
                      value={mappedField || ''}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleUnmap(header)
                        } else {
                          handleMappingChange(header, value)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            Don't import
                          </span>
                        </SelectItem>
                        {fieldDefs.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.label}
                            {field.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {fieldDef?.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Preview Section */}
      {previewRows.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">
            Preview (first {Math.min(5, previewRows.length)} rows)
          </h4>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {mappings.map((mapping, index) => (
                    <th key={index} className="text-left p-2 font-medium">
                      {mapping.dbField}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {mappings.map((mapping, colIndex) => (
                      <td key={colIndex} className="p-2 text-muted-foreground">
                        {row[mapping.csvColumn] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
