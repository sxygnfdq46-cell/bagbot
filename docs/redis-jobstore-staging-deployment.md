# Redis JobStore Staging Deployment Guide

## Overview

This guide covers enabling Redis-backed job storage in the staging environment on Render.com.

## Prerequisites

- Render.com account with access to bagbot services
- Repository deployed via `render.yaml`
- Access to service environment variables

## Configuration Changes

### 1. Redis Service Setup

The `render.yaml` now includes a Redis service:

```yaml
- type: redis
  name: bagbot-redis
  plan: free
  maxmemoryPolicy: noeviction
  ipAllowList: []
```

**Important**: Redis is configured with `maxmemoryPolicy: noeviction` to ensure jobs are never evicted from memory.

### 2. Environment Variables

The following environment variables are automatically configured:

**Backend Service** (`bagbot-backend`):
- `JOB_STORE=redis` - Enables Redis-backed job storage
- `REDIS_URL` - Auto-configured from Redis service connection string

**Worker Service** (`bagbot-worker`):
- `JOB_STORE=redis` - Enables Redis-backed job storage
- `REDIS_URL` - Auto-configured from Redis service connection string

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git merge <feature-branch>  # e.g., copilot/enable-redis-job-store-staging
   git push origin main
   ```

2. **Render Auto-Deploy**
   - Render.com will automatically detect the `render.yaml` changes
   - It will create the Redis service if it doesn't exist
   - Services will be redeployed with new environment variables

3. **Verify Deployment**
   - Check Render.com dashboard for all services to be "Live"
   - Verify Redis service is running

### Option 2: Manual Deployment

If auto-deploy is disabled:

1. **Via Render Dashboard**
   - Go to Render.com Dashboard
   - Navigate to "Blueprint" section
   - Click "Sync" to apply `render.yaml` changes
   
2. **Via Render CLI** (if installed)
   ```bash
   render blueprint sync
   ```

## Smoke Testing

### 1. Run Local Smoke Tests (Pre-Deployment)

```bash
# With fakeredis (no Redis required)
pytest tests/test_redis_jobstore_smoke.py -v

# With real Redis (requires Redis running locally)
REDIS_URL=redis://localhost:6379/0 pytest tests/test_redis_jobstore_smoke.py -v
```

Expected output: All 6 tests should pass.

### 2. Test Metrics Endpoint (Post-Deployment)

```bash
# Test staging metrics endpoint
python3 scripts/test_metrics_endpoint.py https://bagbot-backend.onrender.com
```

Expected output:
```
✓ Found metric: bagbot_job_enqueue_total
✓ Found metric: bagbot_job_run_total
✓ Found metric: bagbot_job_run_duration_seconds
✓ Found metric: bagbot_retry_scheduled_total
✓ Found metric: bagbot_heartbeat_age_seconds
```

### 3. Verify Redis Connection

SSH into backend or worker service (if available) and test:

```python
from redis.asyncio import Redis
import asyncio

async def test():
    redis = Redis.from_url("redis://...", decode_responses=True)
    await redis.ping()
    print("✓ Redis connection successful")
    await redis.close()

asyncio.run(test())
```

### 4. Monitor Worker Behavior

Check worker logs for:

```
✓ Worker registration successful
✓ Jobs claimed exclusively (no duplicate processing)
✓ Retry scheduling working correctly
✓ Heartbeats being sent
```

### 5. Verify Job Store Operations

Create test jobs and verify:

- **Exclusive Claiming**: Only one worker claims each job
- **Retry Scheduling**: Failed jobs are retried with correct backoff
- **State Transitions**: Jobs move through states correctly (enqueued → running → done)
- **Attempts Tracking**: Retry attempts are counted accurately

## Validation Checklist

After deployment, verify:

- [ ] Redis service is running and healthy
- [ ] Backend service can connect to Redis
- [ ] Worker service can connect to Redis
- [ ] `/api/metrics` endpoint returns Prometheus metrics
- [ ] Redis-backed metrics appear (enqueue, run, retry, heartbeat)
- [ ] Worker jobs are claimed exclusively
- [ ] Retry scheduling works with correct backoff
- [ ] Worker registration/deregistration works
- [ ] Heartbeats are being recorded
- [ ] No job duplication across multiple workers

## Troubleshooting

### Redis Connection Errors

**Symptom**: Services fail to connect to Redis
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solutions**:
1. Check Redis service status in Render dashboard
2. Verify `REDIS_URL` environment variable is set correctly
3. Check if Redis service is in the same region as backend/worker
4. Review Redis service logs

### Jobs Not Being Processed

**Symptom**: Jobs stuck in "enqueued" or "retry_scheduled" state

**Solutions**:
1. Check worker service logs for errors
2. Verify worker is running: Check Render dashboard
3. Test job claiming manually in Python console
4. Check Redis memory usage (shouldn't be at capacity with noeviction)

### Metrics Not Appearing

**Symptom**: `/api/metrics` returns 200 but metrics are empty

**Solutions**:
1. Verify jobs have been processed (metrics only appear after activity)
2. Enqueue a test job to generate metrics
3. Check if Prometheus client is properly initialized
4. Review backend logs for errors

### Multiple Workers Claiming Same Job

**Symptom**: Job executed multiple times by different workers

**Solutions**:
1. Verify Redis transactions are working (WATCH/MULTI/EXEC)
2. Check for clock skew between workers
3. Review job claiming logic in logs
4. Ensure Redis version supports transactions

## Monitoring

### Prometheus Scraping

If using Prometheus for monitoring:

```yaml
scrape_configs:
  - job_name: 'bagbot-backend'
    static_configs:
      - targets: ['bagbot-backend.onrender.com:443']
    scheme: https
    metrics_path: /api/metrics
```

### Key Metrics to Monitor

- `bagbot_job_enqueue_total` - Total jobs enqueued
- `bagbot_job_run_total` - Total jobs executed
- `bagbot_job_run_duration_seconds` - Job execution time
- `bagbot_retry_scheduled_total` - Total retries scheduled
- `bagbot_heartbeat_age_seconds` - Worker health

### Redis Health

Monitor Redis:
- Memory usage (should stay below 90% with noeviction)
- Connection count
- Commands per second
- Key count in job namespace

## Rollback Plan

If issues occur:

### Quick Rollback

1. **Revert render.yaml**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or Manually Update Environment Variables**
   - Set `JOB_STORE=memory` in backend and worker services
   - This will fall back to in-memory job storage

### Full Rollback

1. Remove Redis service from render.yaml
2. Remove `JOB_STORE` and `REDIS_URL` from services
3. Deploy changes

## References

- Redis JobStore implementation: `backend/workers/redis_job_store.py`
- Worker orchestration: `backend/workers/orchestration.py`
- Metrics endpoint: `backend/api/metrics.py`
- Smoke tests: `tests/test_redis_jobstore_smoke.py`
- Related PR: #20 (Worker orchestration + graceful shutdown)

## Support

For issues or questions:
1. Check service logs in Render dashboard
2. Review this guide's troubleshooting section
3. Consult Redis and worker implementation code
4. Contact DevOps team
