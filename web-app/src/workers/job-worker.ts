/**
 * Job Worker Base Class
 *
 * Handles polling for pending jobs, executing them, and updating their status.
 * This worker runs as a background service (API route with cron trigger or separate process).
 */

import { createClient } from '@/lib/supabase/server';
import type { Job, JobLog } from '@/types/jobs';

export interface JobProcessor {
  /**
   * Process a specific job type
   * @param job The job to process
   * @returns Result data to be stored in job.result
   */
  process(job: Job): Promise<any>;

  /**
   * Get the job types this processor handles
   */
  getJobTypes(): string[];
}

export interface WorkerConfig {
  workerId: string;
  pollIntervalMs: number;
  jobQueue: string;
  maxConcurrent: number;
  processors: JobProcessor[];
}

/**
 * Job Worker - Polls for and executes background jobs
 */
export class JobWorker {
  private config: WorkerConfig;
  private isRunning = false;
  private currentJobs = new Map<string, Job>();
  private processors = new Map<string, JobProcessor>();

  constructor(config: WorkerConfig) {
    this.config = config;

    // Register processors
    for (const processor of config.processors) {
      for (const jobType of processor.getJobTypes()) {
        this.processors.set(jobType, processor);
      }
    }
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[JobWorker] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[JobWorker] Started worker: ${this.config.workerId}`);
    console.log(`[JobWorker] Registered processors for: ${Array.from(this.processors.keys()).join(', ')}`);

    // Start polling loop
    this.poll();
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`[JobWorker] Stopping worker: ${this.config.workerId}`);

    // Wait for current jobs to finish
    while (this.currentJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[JobWorker] Worker stopped: ${this.config.workerId}`);
  }

  /**
   * Poll for new jobs
   */
  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can take more jobs
        if (this.currentJobs.size < this.config.maxConcurrent) {
          await this.fetchAndExecuteJobs();
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, this.config.pollIntervalMs));
      } catch (error) {
        console.error('[JobWorker] Error in poll loop:', error);
        // Continue polling even if there's an error
        await new Promise(resolve => setTimeout(resolve, this.config.pollIntervalMs));
      }
    }
  }

  /**
   * Fetch pending jobs and execute them
   */
  private async fetchAndExecuteJobs(): Promise<void> {
    const supabase = await createClient();

    // Calculate how many jobs we can take
    const availableSlots = this.config.maxConcurrent - this.currentJobs.size;
    if (availableSlots <= 0) {
      return;
    }

    // Fetch pending jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('job_queue', this.config.jobQueue)
      .in('job_type', Array.from(this.processors.keys()))
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(availableSlots);

    if (error) {
      console.error('[JobWorker] Error fetching jobs:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    console.log(`[JobWorker] Found ${jobs.length} pending job(s)`);

    // Execute each job
    for (const job of jobs) {
      this.executeJob(job as Job);
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: Job): Promise<void> {
    // Add to current jobs
    this.currentJobs.set(job.id, job);

    const supabase = await createClient();

    try {
      // Update job status to processing
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          worker_id: this.config.workerId,
          worker_heartbeat_at: new Date().toISOString(),
          attempts: (job.attempts || 0) + 1,
        })
        .eq('id', job.id)
        .eq('status', 'pending'); // Only update if still pending (optimistic locking)

      if (updateError) {
        console.error('[JobWorker] Error updating job status:', updateError);
        this.currentJobs.delete(job.id);
        return;
      }

      await this.log(job.id, 'info', `Job started by worker ${this.config.workerId}`);

      // Get processor for this job type
      const processor = this.processors.get(job.job_type);
      if (!processor) {
        throw new Error(`No processor found for job type: ${job.job_type}`);
      }

      console.log(`[JobWorker] Processing job ${job.id} (type: ${job.job_type})`);

      // Execute the job
      const result = await processor.process(job);

      // Mark job as completed
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: result || {},
          progress: { percentage: 100 },
        })
        .eq('id', job.id);

      await this.log(job.id, 'info', 'Job completed successfully', { result });

      console.log(`[JobWorker] Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[JobWorker] Job ${job.id} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Check if we should retry
      const attempts = (job.attempts || 0) + 1;
      const maxAttempts = job.max_attempts || 5;
      const shouldRetry = attempts < maxAttempts;

      if (shouldRetry) {
        // Calculate exponential backoff
        const retryDelaySeconds = Math.min(60 * Math.pow(2, attempts - 1), 3600); // Max 1 hour
        const nextRetryAt = new Date(Date.now() + retryDelaySeconds * 1000);

        await supabase
          .from('jobs')
          .update({
            status: 'pending',
            error_message: errorMessage,
            error_stack: errorStack,
            next_retry_at: nextRetryAt.toISOString(),
            retry_delay_seconds: retryDelaySeconds,
          })
          .eq('id', job.id);

        await this.log(
          job.id,
          'warning',
          `Job failed, will retry in ${retryDelaySeconds}s (attempt ${attempts}/${maxAttempts})`,
          { error: errorMessage }
        );

        console.log(
          `[JobWorker] Job ${job.id} will retry in ${retryDelaySeconds}s (attempt ${attempts}/${maxAttempts})`
        );
      } else {
        // Max attempts reached, mark as failed
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error_message: errorMessage,
            error_stack: errorStack,
          })
          .eq('id', job.id);

        await this.log(
          job.id,
          'error',
          `Job failed permanently after ${attempts} attempts`,
          { error: errorMessage, stack: errorStack }
        );

        console.log(`[JobWorker] Job ${job.id} failed permanently after ${attempts} attempts`);
      }
    } finally {
      // Remove from current jobs
      this.currentJobs.delete(job.id);
    }
  }

  /**
   * Log a message for a job
   */
  private async log(
    jobId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    metadata?: any
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from('job_logs').insert({
      job_id: jobId,
      log_level: level,
      message,
      metadata: metadata || null,
    });
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, percentage: number, message?: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('jobs')
      .update({
        progress: { percentage, message },
        worker_heartbeat_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (message) {
      await this.log(jobId, 'info', message, { percentage });
    }
  }
}

/**
 * Helper to update job progress from within a processor
 */
export async function updateJobProgress(
  jobId: string,
  percentage: number,
  message?: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('jobs')
    .update({
      progress: { percentage, message },
      worker_heartbeat_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Helper to log from within a processor
 */
export async function logJob(
  jobId: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  metadata?: any
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('job_logs').insert({
    job_id: jobId,
    log_level: level,
    message,
    metadata: metadata || null,
  });
}
