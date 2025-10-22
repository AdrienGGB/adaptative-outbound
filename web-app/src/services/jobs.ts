// F044: Jobs Service Layer
// Handles all job queue operations

import { createClient } from '@/lib/supabase/client';
import type {
  Job,
  JobLog,
  CreateJobRequest,
  JobFilters,
  JobStats,
  JobDashboardData,
  PaginatedJobs,
  JobStatus,
} from '@/types/jobs';

const supabase = createClient();

/**
 * Create a new job
 */
export async function createJob(
  workspaceId: string,
  request: CreateJobRequest,
): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      workspace_id: workspaceId,
      job_type: request.job_type,
      payload: request.payload,
      priority: request.priority ?? 0,
      scheduled_for: request.scheduled_for,
      job_queue: request.job_queue ?? 'default',
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      progress: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get paginated list of jobs with filters
 */
export async function getJobs(
  workspaceId: string,
  filters: JobFilters = {},
): Promise<PaginatedJobs> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  // Apply filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.job_type) {
    if (Array.isArray(filters.job_type)) {
      query = query.in('job_type', filters.job_type);
    } else {
      query = query.eq('job_type', filters.job_type);
    }
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after);
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before);
  }

  // Sorting
  const sortBy = filters.sort_by ?? 'created_at';
  const sortOrder = filters.sort_order ?? 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count ?? 0;
  const total_pages = Math.ceil(total / limit);

  return {
    jobs: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
  };
}

/**
 * Get a single job by ID (simple version for polling)
 */
export async function getJob(jobId: string): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a single job by ID with its logs
 */
export async function getJobById(jobId: string): Promise<{ job: Job; logs: JobLog[] }> {
  const response = await fetch(`/api/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }

  return response.json();
}

/**
 * Cancel a job (only if pending or processing)
 */
export async function cancelJob(jobId: string): Promise<Job> {
  const response = await fetch(`/api/jobs/${jobId}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel job');
  }

  return response.json();
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<Job> {
  const response = await fetch(`/api/jobs/${jobId}/retry`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to retry job');
  }

  return response.json();
}

/**
 * Delete a job (admin only - should be used carefully)
 */
export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);

  if (error) throw error;
}

/**
 * Get job queue statistics
 */
export async function getJobStats(workspaceId: string): Promise<JobStats> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Get queue depth (pending jobs)
  const { count: queueDepth } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');

  // Get processing count
  const { count: processing } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'processing');

  // Get completed last hour
  const { count: completedLastHour } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('completed_at', oneHourAgo);

  // Get failed last hour
  const { count: failedLastHour } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('status', ['failed', 'dead_letter'])
    .gte('failed_at', oneHourAgo);

  // Get average duration (completed jobs in last hour)
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('started_at, completed_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('completed_at', oneHourAgo)
    .not('started_at', 'is', null)
    .not('completed_at', 'is', null);

  let averageDurationMs = 0;
  if (recentJobs && recentJobs.length > 0) {
    const durations = recentJobs.map((job) => {
      const start = new Date(job.started_at!).getTime();
      const end = new Date(job.completed_at!).getTime();
      return end - start;
    });
    averageDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  // Calculate throughput (jobs per minute)
  const throughputPerMinute = completedLastHour ? completedLastHour / 60 : 0;

  return {
    queue_depth: queueDepth ?? 0,
    processing: processing ?? 0,
    completed_last_hour: completedLastHour ?? 0,
    failed_last_hour: failedLastHour ?? 0,
    average_duration_ms: Math.round(averageDurationMs),
    throughput_per_minute: Math.round(throughputPerMinute * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Get dashboard data (stats + recent jobs)
 */
export async function getJobDashboard(workspaceId: string): Promise<JobDashboardData> {
  const stats = await getJobStats(workspaceId);

  // Get recent failures
  const { data: recentFailures } = await supabase
    .from('jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['failed', 'dead_letter'])
    .order('failed_at', { ascending: false })
    .limit(5);

  // Get recent completions
  const { data: recentCompletions } = await supabase
    .from('jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  return {
    stats,
    queues: [
      {
        queue: 'default',
        depth: stats.queue_depth,
        processing: stats.processing,
      },
    ],
    recent_failures: recentFailures ?? [],
    recent_completions: recentCompletions ?? [],
  };
}

/**
 * Subscribe to job updates (real-time)
 */
export function subscribeToJob(
  jobId: string,
  callback: (job: Job) => void,
): () => void {
  const channel = supabase
    .channel(`job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        callback(payload.new as Job);
      },
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to workspace jobs (real-time)
 */
export function subscribeToWorkspaceJobs(
  workspaceId: string,
  callback: (job: Job, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
): () => void {
  const channel = supabase
    .channel(`workspace-jobs:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        callback(
          payload.new as Job,
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        );
      },
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
