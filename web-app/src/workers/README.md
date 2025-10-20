# Background Job Workers

This directory contains the background job processing system for Adaptive Outbound.

## Architecture

### Components

1. **JobWorker** (`job-worker.ts`)
   - Base worker class that polls for pending jobs
   - Handles job lifecycle (pending → processing → completed/failed)
   - Implements retry logic with exponential backoff
   - Manages concurrent job execution

2. **Job Processors** (e.g., `enrichment-processor.ts`)
   - Implement specific job type logic
   - Called by JobWorker to process jobs
   - Update job progress and logs

3. **Worker API Route** (`/app/api/jobs/worker/route.ts`)
   - HTTP endpoint to trigger worker execution
   - Called by Vercel Cron every minute
   - Can be called manually for testing

### Flow

```
┌─────────────┐
│ Vercel Cron │  (every minute)
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ POST /api/jobs/worker │
└──────┬──────────────┘
       │
       v
┌─────────────┐
│  JobWorker  │
└──────┬──────┘
       │
       ├─> Fetch pending jobs from database
       │
       ├─> For each job:
       │   ├─> Update status to 'processing'
       │   ├─> Call appropriate processor
       │   ├─> Update progress
       │   └─> Mark as completed/failed
       │
       └─> Return execution summary
```

## Job Types

### Current Processors

#### EnrichmentProcessor
Handles:
- `enrich_account` - Enrich account data using Apollo.io
- `enrich_contact` - Enrich contact data using Apollo.io

## Configuration

### Environment Variables

```bash
# Required for worker authentication
WORKER_SECRET_TOKEN=your-secret-token-here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Worker Config

In `worker/route.ts`:

```typescript
{
  workerId: 'vercel-...',    // Unique worker ID
  pollIntervalMs: 5000,      // Poll every 5 seconds
  jobQueue: 'default',       // Job queue to process
  maxConcurrent: 5,          // Max concurrent jobs
  processors: [...]          // Array of job processors
}
```

## Deployment

### Local Development

The worker API route is available locally but requires manual triggering:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Trigger worker manually
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"
```

### Production (Vercel)

1. **Automatic Execution**:
   - Vercel Cron triggers `/api/jobs/worker` every minute
   - Configuration in `vercel.json`

2. **Environment Variables**:
   ```bash
   # Set in Vercel dashboard
   WORKER_SECRET_TOKEN=<strong-random-token>
   ```

3. **Monitoring**:
   ```bash
   # Check worker status
   curl https://your-app.vercel.app/api/jobs/worker \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Testing

### Manual Worker Trigger

```bash
# Local
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"

# Production
curl -X POST https://your-app.vercel.app/api/jobs/worker \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN"
```

### Create Test Job

```typescript
// In your code or API route
const { data: job } = await supabase
  .from('jobs')
  .insert({
    workspace_id: 'workspace-uuid',
    job_type: 'enrich_account',
    payload: {
      account_id: 'account-uuid',
      domain: 'example.com'
    },
    status: 'pending'
  })
  .select()
  .single();

// Trigger worker
await fetch('/api/jobs/worker', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dev-secret-token'
  }
});

// Check job status
const { data: updatedJob } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', job.id)
  .single();

console.log(updatedJob.status); // Should be 'completed' or 'processing'
```

## Adding New Job Types

### 1. Create Processor

```typescript
// workers/my-processor.ts
import { JobProcessor } from './job-worker';
import type { Job } from '@/types/jobs';

export class MyProcessor implements JobProcessor {
  getJobTypes(): string[] {
    return ['my_job_type'];
  }

  async process(job: Job): Promise<any> {
    // Your job logic here
    return { success: true };
  }
}
```

### 2. Register Processor

```typescript
// app/api/jobs/worker/route.ts
import { MyProcessor } from '@/workers/my-processor';

new JobWorker({
  // ... config
  processors: [
    new EnrichmentProcessor(),
    new MyProcessor(), // Add your processor
  ],
});
```

### 3. Create Jobs

```typescript
await supabase.from('jobs').insert({
  workspace_id: workspaceId,
  job_type: 'my_job_type',
  payload: { /* your data */ },
  status: 'pending'
});
```

## Error Handling

### Retry Logic

Jobs automatically retry on failure with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 60s
- Attempt 3: After 120s
- Attempt 4: After 240s
- Attempt 5: After 480s
- After 5 attempts: Marked as 'failed'

### Dead Letter Queue

Failed jobs (after max attempts) are marked with `status='failed'` and can be:
- Manually retried via the UI
- Moved to a dead letter queue for investigation
- Alerted to administrators

## Monitoring

### Job Logs

All jobs log to the `job_logs` table:

```sql
SELECT * FROM job_logs
WHERE job_id = 'job-uuid'
ORDER BY created_at DESC;
```

### Job Stats

Query job statistics:

```sql
-- Jobs by status
SELECT status, COUNT(*) as count
FROM jobs
WHERE workspace_id = 'workspace-uuid'
GROUP BY status;

-- Failed jobs (last 24 hours)
SELECT *
FROM jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Slow jobs (> 5 minutes)
SELECT id, job_type, started_at, completed_at,
       EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM jobs
WHERE status = 'completed'
  AND EXTRACT(EPOCH FROM (completed_at - started_at)) > 300
ORDER BY duration_seconds DESC;
```

### Worker Health

```bash
# Check worker status
curl https://your-app.vercel.app/api/jobs/worker \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "status": "healthy",
  "worker_exists": true,
  "worker_id": "vercel-iad1-1234567890",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": {
    "region": "iad1",
    "env": "production"
  }
}
```

## Performance Considerations

### Concurrency

- Default: 5 concurrent jobs
- Increase for more throughput (watch for database/API limits)
- Decrease if hitting rate limits

### Poll Interval

- Default: 5 seconds between polls
- Decrease for lower latency (more database queries)
- Increase to reduce database load

### Timeouts

- Vercel function timeout: 5 minutes (Pro plan)
- Long-running jobs should:
  - Update progress regularly
  - Break into smaller chunks
  - Use job dependencies

## Security

### Worker Authentication

- Worker endpoint requires `Authorization: Bearer <token>`
- Token configured via `WORKER_SECRET_TOKEN` env var
- Use strong, random tokens in production

### Apollo API Keys

- Stored encrypted in `workspace_settings.apollo_api_key_encrypted`
- Decrypted only during job execution
- Never exposed to frontend

### RLS Policies

- Jobs are isolated by workspace
- Workers use service role (bypasses RLS)
- Logs are only visible to workspace members

## Troubleshooting

### Jobs stuck in 'pending'

1. Check if worker is running:
   ```bash
   curl https://your-app.vercel.app/api/jobs/worker \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. Check Vercel Cron logs in dashboard

3. Manually trigger worker:
   ```bash
   curl -X POST https://your-app.vercel.app/api/jobs/worker \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Jobs failing immediately

1. Check job logs:
   ```sql
   SELECT * FROM job_logs WHERE job_id = 'job-uuid';
   ```

2. Check error message:
   ```sql
   SELECT error_message, error_stack FROM jobs WHERE id = 'job-uuid';
   ```

3. Common issues:
   - Missing Apollo API key
   - Invalid payload
   - Account/contact not found
   - Rate limit exceeded

### Worker timing out

- Check function duration in Vercel logs
- Reduce `maxConcurrent` if processing too many jobs
- Break large jobs into smaller jobs with dependencies

## Future Improvements

- [ ] Worker dashboard/monitoring UI
- [ ] Webhook notifications on job completion
- [ ] Priority queues (high, normal, low)
- [ ] Job dependencies and workflows
- [ ] Scheduled jobs (run at specific time)
- [ ] Recurring jobs (daily, weekly, etc.)
- [ ] Worker metrics (Prometheus/Datadog)
- [ ] Dead letter queue management UI
- [ ] Job replay/resubmit functionality
