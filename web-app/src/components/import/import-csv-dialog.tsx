"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Download } from 'lucide-react'
import { parseCSVFile, downloadCSVTemplate } from '@/lib/csv-parser'
import { autoDetectMapping } from '@/types/import'
import { ColumnMapping } from './column-mapping'
import { ImportProgress } from './import-progress'
import { createJob } from '@/services/jobs'
import type {
  EntityType,
  ColumnMapping as ColumnMappingType,
  ImportOptions,
  ImportMetadata,
  ImportJobPayload,
} from '@/types/import'

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  workspaceId: string
}

type Step = 'upload' | 'mapping' | 'importing'

export function ImportCsvDialog({
  open,
  onOpenChange,
  entityType,
  workspaceId,
}: ImportCsvDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMappingType[]>([])
  const [uploading, setUploading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const entityLabels = {
    accounts: 'Accounts',
    contacts: 'Contacts',
    tasks: 'Tasks',
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    try {
      setFile(selectedFile)

      // Parse CSV to get headers and preview
      const parsed = await parseCSVFile(selectedFile)
      setCsvHeaders(parsed.headers)
      setPreviewRows(parsed.previewRows)

      // Auto-detect column mappings
      const autoMappings = autoDetectMapping(parsed.headers, entityType)
      setColumnMappings(autoMappings)
    } catch (error) {
      console.error('Failed to parse CSV:', error)
      alert('Failed to parse CSV file. Please check the file format.')
    }
  }

  const handleUploadAndImport = async () => {
    if (!file) return

    try {
      setUploading(true)

      // Upload file to storage
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch(
        `/api/upload/csv?workspace_id=${workspaceId}`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const uploadData = await uploadResponse.json()

      // Create import job
      const metadata: ImportMetadata = {
        fileName: file.name,
        fileSize: file.size,
        rowCount: previewRows.length,
        headers: csvHeaders,
        uploadedAt: new Date().toISOString(),
        fileUrl: uploadData.file.url,
      }

      const options: ImportOptions = {
        entityType,
        updateExisting: false,
        skipDuplicates: true,
        batchSize: 100,
      }

      const payload: ImportJobPayload = {
        fileUrl: uploadData.file.url,
        entityType,
        mapping: columnMappings,
        options,
        metadata,
      }

      const job = await createJob(workspaceId, {
        job_type: 'import_csv',
        payload,
        priority: 5,
      })

      setJobId(job.id)
      setStep('importing')

      // Trigger worker to process job
      fetch(`/api/workers/import-csv?job_id=${job.id}`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Failed to start import:', error)
      alert('Failed to start import. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(entityType, `${entityType}-template.csv`)
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setCsvHeaders([])
    setPreviewRows([])
    setColumnMappings([])
    setJobId(null)
    onOpenChange(false)
  }

  const handleImportComplete = () => {
    handleClose()
    // Refresh the page data
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityLabels[entityType]}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload File */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground">
                  Select a CSV file to import {entityLabels[entityType].toLowerCase()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                {file ? (
                  <>
                    <FileText className="h-12 w-12 text-primary mb-4" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Choose Different File
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV files only (max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            {file && csvHeaders.length > 0 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <p className="text-sm">
                      <span className="font-medium">Detected columns:</span>{' '}
                      {csvHeaders.join(', ')}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Rows:</span> ~
                      {previewRows.length}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={() => setStep('mapping')}>
                    Next: Map Columns
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <ColumnMapping
              csvHeaders={csvHeaders}
              previewRows={previewRows}
              mappings={columnMappings}
              entityType={entityType}
              onMappingsChange={setColumnMappings}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUploadAndImport} disabled={uploading}>
                  {uploading ? 'Starting Import...' : 'Start Import'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Importing Progress */}
        {step === 'importing' && jobId && (
          <ImportProgress
            jobId={jobId}
            workspaceId={workspaceId}
            onComplete={handleImportComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
