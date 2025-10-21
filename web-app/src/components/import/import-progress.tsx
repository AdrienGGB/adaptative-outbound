"use client"

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react'
import { getJob } from '@/services/jobs'
import type { Job } from '@/types/jobs'
import type { ImportProgress as ImportProgressType, ImportResult } from '@/types/import'

interface ImportProgressProps {
  jobId: string
  workspaceId: string
  onComplete: () => void
}

export function ImportProgress({
  jobId,
  workspaceId,
  onComplete,
}: ImportProgressProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    const pollJob = async () => {
      try {
        const latestJob = await getJob(jobId)
        setJob(latestJob)

        // Stop polling if job is complete or failed
        if (latestJob.status === 'completed' || latestJob.status === 'failed') {
          setIsPolling(false)
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
      }
    }

    // Initial fetch
    pollJob()

    // Poll every 2 seconds
    let interval: NodeJS.Timeout | null = null
    if (isPolling) {
      interval = setInterval(pollJob, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [jobId, isPolling])

  const progress = job?.progress as ImportProgressType | undefined
  const result = job?.result as ImportResult | undefined

  const handleDownloadErrorReport = () => {
    if (!result?.errors || result.errors.length === 0) return

    // Create CSV of errors
    const headers = ['Row', 'Column', 'Value', 'Error']
    const rows = result.errors.map((err) => [
      err.row,
      err.column,
      err.value,
      err.error,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `import-errors-${jobId}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center gap-3">
        {job?.status === 'completed' && (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        )}
        {job?.status === 'failed' && (
          <XCircle className="h-8 w-8 text-destructive" />
        )}
        {job?.status === 'processing' && (
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        <div>
          <h3 className="text-lg font-medium">
            {job?.status === 'completed' && 'Import Complete'}
            {job?.status === 'failed' && 'Import Failed'}
            {job?.status === 'processing' && 'Importing...'}
            {job?.status === 'pending' && 'Starting Import...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {progress?.message || 'Preparing to import...'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {progress.processed} / {progress.total} rows processed
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      )}

      {/* Stats */}
      {(progress || result) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {result?.successful ?? progress?.successful ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-destructive">
              {result?.failed ?? progress?.failed ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">
              {result?.total ?? progress?.total ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
      )}

      {/* Error Message (if failed) */}
      {job?.status === 'failed' && job.error_message && (
        <div className="border border-destructive rounded-lg p-4 bg-destructive/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Import Failed</p>
              <p className="text-sm text-destructive/80 mt-1">
                {job.error_message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Errors List */}
      {result && result.errors && result.errors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Errors ({result.errors.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadErrorReport}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Error Report
            </Button>
          </div>
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Row</th>
                  <th className="text-left p-2">Column</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.slice(0, 50).map((error, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{error.row}</td>
                    <td className="p-2">{error.column}</td>
                    <td className="p-2 text-destructive">{error.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.errors.length > 50 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                Showing first 50 errors. Download full report for all errors.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {job?.status === 'completed' && (
        <div className="flex justify-end">
          <Button onClick={onComplete}>Done</Button>
        </div>
      )}

      {job?.status === 'failed' && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onComplete}>
            Close
          </Button>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      )}
    </div>
  )
}
