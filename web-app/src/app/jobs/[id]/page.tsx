'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, XCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/auth-context'
import { getJobById, retryJob, cancelJob, subscribeToJob } from '@/services/jobs'
import type { Job, JobLog } from '@/types/jobs'
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_TYPE_LABELS, canRetryJob, canCancelJob } from '@/types/jobs'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { workspace } = useAuth()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [logs, setLogs] = useState<JobLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace?.id) return

    loadJobData()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToJob(jobId, (updatedJob) => {
      setJob(updatedJob)
    })

    return () => unsubscribe()
  }, [workspace?.id, jobId])

  async function loadJobData() {
    try {
      setLoading(true)
      setError(null)
      const data = await getJobById(jobId)
      setJob(data.job)
      setLogs(data.logs)
    } catch (err) {
      console.error('Failed to load job:', err)
      setError('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  async function handleRetry() {
    if (!job) return
    try {
      setActionLoading(true)
      await retryJob(job.id)
      await loadJobData()
    } catch (err) {
      console.error('Failed to retry job:', err)
      alert('Failed to retry job')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!job) return
    if (!confirm('Are you sure you want to cancel this job?')) return

    try {
      setActionLoading(true)
      await cancelJob(job.id)
      await loadJobData()
    } catch (err) {
      console.error('Failed to cancel job:', err)
      alert('Failed to cancel job')
    } finally {
      setActionLoading(false)
    }
  }

  function formatDuration(startedAt?: string, completedAt?: string, failedAt?: string): string {
    if (!startedAt) return 'Not started'

    const start = new Date(startedAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() :
                failedAt ? new Date(failedAt).getTime() :
                Date.now()

    const durationMs = end - start
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'failed':
      case 'dead_letter':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  function getLogLevelColor(level: string): string {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppShell>
    )
  }

  if (error || !job) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg text-gray-600">{error || 'Job not found'}</p>
          <Button onClick={() => router.push('/jobs')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/jobs')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Job Details</h1>
              <p className="text-sm text-gray-500">{job.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canRetryJob(job) && (
              <Button onClick={handleRetry} disabled={actionLoading} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            {canCancelJob(job) && (
              <Button onClick={handleCancel} disabled={actionLoading} variant="destructive" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(job.status)}
                <div>
                  <CardTitle>{JOB_TYPE_LABELS[job.job_type]}</CardTitle>
                  <CardDescription>Queue: {job.job_queue}</CardDescription>
                </div>
              </div>
              <Badge variant={JOB_STATUS_COLORS[job.status]}>
                {JOB_STATUS_LABELS[job.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm">{new Date(job.created_at).toLocaleString()}</p>
              </div>
              {job.started_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Started</p>
                  <p className="text-sm">{new Date(job.started_at).toLocaleString()}</p>
                </div>
              )}
              {(job.completed_at || job.failed_at) && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {job.completed_at ? 'Completed' : 'Failed'}
                  </p>
                  <p className="text-sm">
                    {new Date(job.completed_at || job.failed_at!).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-sm">{formatDuration(job.started_at, job.completed_at, job.failed_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Attempts</p>
                <p className="text-sm">{job.attempts} / {job.max_attempts}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <p className="text-sm">{job.priority}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        {job.progress && Object.keys(job.progress).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {job.progress.percentage !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{job.progress.message || 'Processing...'}</span>
                    <span>{job.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${job.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              {(job.progress.total !== undefined || job.progress.processed !== undefined) && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {job.progress.total !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{job.progress.total}</p>
                    </div>
                  )}
                  {job.progress.processed !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Processed</p>
                      <p className="text-2xl font-bold">{job.progress.processed}</p>
                    </div>
                  )}
                  {job.progress.failed !== undefined && job.progress.failed > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{job.progress.failed}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
            <CardDescription>Job input data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Result Card */}
        {job.result && Object.keys(job.result).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Job output data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Error Card */}
        {job.error_message && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600 mb-2">{job.error_message}</p>
              {job.error_stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Stack Trace</summary>
                  <pre className="bg-red-50 p-4 rounded-lg overflow-x-auto text-xs mt-2 text-red-800">
                    {job.error_stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
            <CardDescription>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No logs available</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-sm ${getLogLevelColor(log.log_level)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.log_level.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{log.message}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium">Metadata</summary>
                            <pre className="mt-1 text-xs opacity-80">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AppShell>
  )
}
