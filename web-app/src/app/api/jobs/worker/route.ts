/**
 * Job Worker API Route
 *
 * This endpoint triggers the job worker to process pending jobs.
 * Can be called:
 * 1. By a cron job (Vercel Cron, GitHub Actions, etc.)
 * 2. Manually for testing
 * 3. By an external scheduler
 *
 * In production, this should be:
 * - Protected by a secret token
 * - Triggered every 30-60 seconds
 * - Monitored for failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { JobWorker } from '@/workers/job-worker';
import { EnrichmentProcessor } from '@/workers/enrichment-processor';
import { DuplicateDetector } from '@/workers/duplicate-detector';

// Worker instance (persists across requests in development)
let workerInstance: JobWorker | null = null;

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution (Vercel Pro limit)

/**
 * POST /api/jobs/worker
 *
 * Execute job worker once (processes available jobs then returns)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (in production, use a secret token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WORKER_SECRET_TOKEN || 'dev-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Worker API] Starting job execution...');

    // Create worker if not exists
    if (!workerInstance) {
      workerInstance = new JobWorker({
        workerId: `vercel-${process.env.VERCEL_REGION || 'local'}-${Date.now()}`,
        pollIntervalMs: 5000, // 5 seconds between polls
        jobQueue: 'default',
        maxConcurrent: 5, // Process up to 5 jobs concurrently
        processors: [
          new EnrichmentProcessor(),
          new DuplicateDetector(),
          // Add more processors here as needed
        ],
      });
    }

    // Run one poll cycle
    const startTime = Date.now();
    await workerInstance['fetchAndExecuteJobs'](); // Call private method (for single execution)

    const duration = Date.now() - startTime;

    console.log(`[Worker API] Execution completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      worker_id: workerInstance['config'].workerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Worker API] Error:', error);

    return NextResponse.json(
      {
        error: 'Worker execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/worker
 *
 * Get worker status (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WORKER_SECRET_TOKEN || 'dev-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      worker_exists: !!workerInstance,
      worker_id: workerInstance?.['config']?.workerId || null,
      timestamp: new Date().toISOString(),
      environment: {
        region: process.env.VERCEL_REGION || 'local',
        env: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
