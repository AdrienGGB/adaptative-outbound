# F044-A: Background Jobs & Enrichment Testing Guide

This guide explains how to test the complete F044-A implementation locally and in production.

## Prerequisites

1. **Local Supabase Running**:
   ```bash
   npx supabase status
   # Should show "supabase local development setup is running"
   ```

2. **Dev Server Running**:
   ```bash
   cd web-app
   npm run dev
   # Server at http://localhost:3000
   ```

3. **Apollo.io API Key** (Optional for full enrichment testing):
   - Get a free trial key from https://app.apollo.io/#/settings/integrations/api
   - Or use the test mode which simulates API responses

## Test Scenarios

### Test 1: Configure Apollo API Key

**Steps**:
1. Navigate to http://localhost:3000/workspace/settings/api
2. Enter an Apollo.io API key (or use `test-key-12345` for mock testing)
3. Click "Save"
4. Click "Test Connection"

**Expected Result**:
- ✅ "API key saved successfully" message
- ✅ "Configured" badge appears
- ✅ Test connection shows credits remaining (or mock response)

**Verify in Database**:
```sql
SELECT
  workspace_id,
  apollo_api_key_encrypted IS NOT NULL as has_key,
  apollo_auto_enrich,
  enrichment_credits_used
FROM workspace_settings;
```

### Test 2: Create Enrichment Job via UI

**Steps**:
1. Navigate to http://localhost:3000/accounts
2. Click on any account (or create a new one)
3. Click the "Enrich" button (with Sparkles icon)
4. Wait for redirect to job detail page

**Expected Result**:
- ✅ Redirects to `/jobs/[id]`
- ✅ Job shows as "Pending" or "Processing"
- ✅ Progress bar appears

**Verify Job Created**:
```sql
SELECT id, job_type, status, payload, created_at
FROM jobs
WHERE job_type = 'enrich_account'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 3: Trigger Worker Manually

**Steps**:
```bash
# Trigger the worker to process pending jobs
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "duration_ms": 1234,
  "worker_id": "vercel-local-1234567890",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Check Logs**:
```bash
# In terminal running npm run dev, you should see:
# [JobWorker] Found 1 pending job(s)
# [JobWorker] Processing job xxx (type: enrich_account)
# [JobWorker] Job xxx completed successfully
```

### Test 4: Verify Job Execution

**Check Job Status**:
```sql
SELECT
  id,
  job_type,
  status,
  progress,
  started_at,
  completed_at,
  error_message
FROM jobs
WHERE job_type = 'enrich_account'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Status**:
- `status = 'completed'` (if Apollo key valid)
- `status = 'failed'` (if Apollo key invalid or not configured)
- `progress->>'percentage' = '100'` (if completed)

**Check Job Logs**:
```sql
SELECT
  log_level,
  message,
  metadata,
  created_at
FROM job_logs
WHERE job_id = 'your-job-id'
ORDER BY created_at ASC;
```

**Expected Logs**:
1. "Starting enrichment for account..."
2. "Fetching workspace settings..."
3. "Initializing Apollo client..."
4. "Enriching with domain..."
5. "Processing enrichment data..."
6. "Updating account record..."
7. "Account enrichment completed successfully"

### Test 5: Verify Account Was Enriched

**Check Account Data**:
```sql
SELECT
  id,
  name,
  domain,
  industry,
  employee_count,
  annual_revenue,
  city,
  state,
  country,
  enriched_at,
  metadata->>'apollo_enriched_at' as apollo_enriched_at
FROM accounts
WHERE id = 'your-account-id';
```

**Expected Changes**:
- `enriched_at` is now set
- New fields populated (industry, employee_count, etc.)
- `metadata` contains Apollo enrichment data

### Test 6: Job Retry on Failure

**Create Failing Job**:
```sql
-- Insert job with invalid account ID
INSERT INTO jobs (workspace_id, job_type, payload, status)
VALUES (
  'your-workspace-id',
  'enrich_account',
  '{"account_id": "00000000-0000-0000-0000-000000000000", "domain": "nonexistent.fake"}'::jsonb,
  'pending'
);
```

**Trigger Worker**:
```bash
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"
```

**Check Retry Behavior**:
```sql
SELECT
  id,
  status,
  attempts,
  max_attempts,
  next_retry_at,
  error_message
FROM jobs
WHERE payload->>'account_id' = '00000000-0000-0000-0000-000000000000';
```

**Expected**:
- First attempt: `status = 'pending'`, `attempts = 1`, `next_retry_at` set to ~60s in future
- After 5 attempts: `status = 'failed'`, `attempts = 5`
- `error_message` contains "Account not found"

### Test 7: Real-time Progress Updates

**Setup**:
1. Open browser to job detail page: http://localhost:3000/jobs/[id]
2. In another terminal, trigger worker to process the job

**Expected Behavior**:
- Progress bar updates in real-time (10% → 20% → 30% → ... → 100%)
- Status changes from "Pending" → "Processing" → "Completed"
- Logs appear in real-time
- No page refresh needed (Supabase Realtime subscriptions)

### Test 8: Multiple Jobs Concurrency

**Create Multiple Jobs**:
```bash
# Create 10 test jobs
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/jobs \
    -H "Authorization: Bearer $(supabase auth token)" \
    -H "Content-Type: application/json" \
    -d '{
      "workspace_id": "your-workspace-id",
      "job_type": "enrich_account",
      "payload": {
        "account_id": "account-'$i'",
        "domain": "example'$i'.com"
      }
    }'
done
```

**Trigger Worker**:
```bash
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"
```

**Check Concurrent Processing**:
```sql
SELECT status, COUNT(*) as count
FROM jobs
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY status;
```

**Expected**:
- Multiple jobs processed simultaneously (up to maxConcurrent=5)
- All jobs complete within reasonable time
- No race conditions or deadlocks

### Test 9: Worker Health Check

**Check Worker Status**:
```bash
curl http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"
```

**Expected Response**:
```json
{
  "status": "healthy",
  "worker_exists": true,
  "worker_id": "vercel-local-1234567890",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": {
    "region": "local",
    "env": "development"
  }
}
```

### Test 10: API Integration - Mock Apollo Responses

For testing without a real Apollo API key, modify the Apollo client to return mock data:

**Create Mock Apollo Client** (for testing only):
```typescript
// lib/apollo-client-mock.ts
export class MockApolloClient {
  async enrichOrganization(request: { domain: string }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      organization: {
        id: 'mock-org-123',
        name: `Mock Company for ${request.domain}`,
        website_url: `https://${request.domain}`,
        primary_domain: request.domain,
        industry: 'Technology',
        estimated_num_employees: 50,
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        linkedin_url: `https://linkedin.com/company/${request.domain}`,
      },
      credits_used: 1,
    };
  }

  async enrichPerson(request: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      person: {
        id: 'mock-person-123',
        first_name: 'John',
        last_name: 'Doe',
        email: request.email,
        title: 'Software Engineer',
        linkedin_url: 'https://linkedin.com/in/johndoe',
      },
      credits_used: 1,
    };
  }
}
```

**Use in Tests**:
Set environment variable:
```bash
export USE_MOCK_APOLLO=true
```

Then modify `enrichment-processor.ts` to check this flag:
```typescript
const apollo = process.env.USE_MOCK_APOLLO === 'true'
  ? new MockApolloClient()
  : createApolloClient(settings.apollo_api_key_encrypted);
```

## Common Issues & Troubleshooting

### Issue: Jobs Stuck in "Pending"

**Symptoms**:
- Jobs created but never process
- Status remains "pending" indefinitely

**Diagnosis**:
```sql
SELECT id, job_type, status, created_at, scheduled_for
FROM jobs
WHERE status = 'pending'
ORDER BY created_at ASC;
```

**Solutions**:
1. Trigger worker manually:
   ```bash
   curl -X POST http://localhost:3000/api/jobs/worker \
     -H "Authorization: Bearer dev-secret-token"
   ```

2. Check worker is registered for job type:
   ```typescript
   // In worker/route.ts
   processors: [
     new EnrichmentProcessor(), // Should handle 'enrich_account'
   ]
   ```

3. Check Supabase connection:
   ```bash
   npx supabase status
   ```

### Issue: "Apollo API key not configured"

**Symptoms**:
- Job fails immediately
- Error message: "Apollo API key not configured for this workspace"

**Solutions**:
1. Navigate to `/workspace/settings/api`
2. Enter a valid Apollo API key
3. Click "Save"
4. Retry the job

### Issue: Worker Unauthorized (401)

**Symptoms**:
- `curl` returns `{"error": "Unauthorized"}`

**Solution**:
- Use correct authorization header:
  ```bash
  -H "Authorization: Bearer dev-secret-token"
  ```

### Issue: TypeScript Errors

**Symptoms**:
- Compilation errors about missing types
- `createClient` not found

**Solution**:
1. Restart dev server:
   ```bash
   # Kill current server (Ctrl+C)
   npm run dev
   ```

2. Check imports:
   ```typescript
   import { createClient } from '@/lib/supabase/server';
   import type { Job } from '@/types/jobs';
   ```

### Issue: RLS Policy Errors

**Symptoms**:
- "new row violates row-level security policy"
- Jobs can be created but not read

**Solution**:
Check RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('jobs', 'job_logs', 'workspace_settings');
```

Expected policies:
- `jobs`: SELECT, INSERT, UPDATE policies
- `job_logs`: SELECT policy
- `workspace_settings`: SELECT, ALL policies

## Performance Testing

### Test Job Processing Speed

**Measure Single Job**:
```bash
# Create job
JOB_ID=$(curl -s -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "...", "job_type": "enrich_account", ...}' \
  | jq -r '.id')

# Record start time
START=$(date +%s)

# Trigger worker
curl -X POST http://localhost:3000/api/jobs/worker \
  -H "Authorization: Bearer dev-secret-token"

# Wait for completion
while [ $(psql $DATABASE_URL -t -c "SELECT status FROM jobs WHERE id='$JOB_ID'") != "completed" ]; do
  sleep 1
done

# Record end time
END=$(date +%s)
DURATION=$((END - START))

echo "Job completed in $DURATION seconds"
```

**Benchmark Results** (expected):
- Account enrichment: 2-5 seconds
- Contact enrichment: 2-5 seconds
- With Apollo API: +1-2 seconds for API call

### Test Concurrent Job Processing

Create 20 jobs, trigger worker, measure total time:

```bash
# Expected: ~10-15 seconds for 20 jobs (maxConcurrent=5)
# Without concurrency: ~40-100 seconds
```

## Production Testing (After Deployment)

### 1. Verify Vercel Cron

**Check Cron Configuration**:
- Go to Vercel dashboard → Project → Settings → Cron Jobs
- Should show: `* * * * *` (every minute) → `/api/jobs/worker`

**Test Cron Trigger**:
1. Create a job in production
2. Wait 1-2 minutes
3. Check if job status changed from "pending"

### 2. Monitor Worker Logs

**Vercel Dashboard**:
- Go to Deployments → Latest → Functions
- Find `/api/jobs/worker`
- View invocation logs

**Expected Log Entries** (every minute):
```
[JobWorker] Starting job execution...
[JobWorker] Found X pending job(s)
[JobWorker] Execution completed in Xms
```

### 3. Set Production Environment Variables

**Required in Vercel**:
```
WORKER_SECRET_TOKEN=<strong-random-string-here>
NEXT_PUBLIC_SUPABASE_URL=<production-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

### 4. Production Health Check

```bash
curl https://your-app.vercel.app/api/jobs/worker \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN"
```

Expected:
```json
{
  "status": "healthy",
  "worker_id": "vercel-iad1-...",
  "environment": {
    "region": "iad1",
    "env": "production"
  }
}
```

## Success Criteria

F044-A is fully functional when:

- ✅ Jobs can be created via UI ("Enrich" button)
- ✅ Jobs are processed automatically (via Vercel Cron in production, manual trigger in dev)
- ✅ Account data is enriched with Apollo.io data
- ✅ Job status updates in real-time
- ✅ Failed jobs retry with exponential backoff
- ✅ Job logs are visible in UI
- ✅ Worker health check passes
- ✅ No errors in Vercel logs

## Next Steps

After F044-A is tested and working:

1. **Deploy to Production**:
   - Commit and push changes
   - Vercel auto-deploys
   - Set `WORKER_SECRET_TOKEN` in Vercel

2. **Monitor Initial Usage**:
   - Watch Vercel function logs
   - Check for failed jobs
   - Monitor Apollo credit usage

3. **Begin F044-B** (CSV Import):
   - Follow 6-week implementation plan
   - Start with Phase 1: Foundation

---

**Testing Checklist**: Use this to verify F044-A is complete

- [ ] Test 1: Configure Apollo API Key
- [ ] Test 2: Create Enrichment Job via UI
- [ ] Test 3: Trigger Worker Manually
- [ ] Test 4: Verify Job Execution
- [ ] Test 5: Verify Account Was Enriched
- [ ] Test 6: Job Retry on Failure
- [ ] Test 7: Real-time Progress Updates
- [ ] Test 8: Multiple Jobs Concurrency
- [ ] Test 9: Worker Health Check
- [ ] Test 10: Mock Apollo Responses (if no API key)
- [ ] Production: Vercel Cron Working
- [ ] Production: Environment Variables Set
- [ ] Production: Health Check Passing
- [ ] Production: First Real Enrichment Successful
