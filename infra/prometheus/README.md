# Prometheus Configuration for BagBot

This directory contains Prometheus scrape configurations and alert rules for monitoring BagBot.

## Files

### scrape-bagbot.yml
Prometheus scrape job configuration for collecting metrics from BagBot's `/api/metrics` endpoint.

**Usage:**
Include this in your main `prometheus.yml` configuration:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  # ... other scrape jobs ...
  
  # Include BagBot scrape job
  - job_name: 'bagbot-staging'
    scrape_interval: 15s
    scrape_timeout: 8s
    metrics_path: '/api/metrics'
    scheme: https
    static_configs:
      - targets:
          - 'bagbot-backend.onrender.com'
        labels:
          environment: 'staging'
          service: 'bagbot'
          component: 'backend'
```

Or use the file directly with `--config.file`:
```bash
prometheus --config.file=infra/prometheus/scrape-bagbot.yml
```

### bagbot_rules.yml
Alert rules for monitoring BagBot worker health and job processing.

**Usage:**
Load this file in your Prometheus configuration:

```yaml
# prometheus.yml
rule_files:
  - 'infra/prometheus/bagbot_rules.yml'
```

Or specify it on the command line:
```bash
prometheus --config.file=prometheus.yml --rules.file=infra/prometheus/bagbot_rules.yml
```

## Alerts

### WorkerHeartbeatStale
- **Severity:** Critical
- **Trigger:** Worker heartbeat age exceeds 120 seconds for 2 minutes
- **Description:** Indicates worker may be down, stuck, or experiencing network issues

### JobErrorSpike
- **Severity:** Warning
- **Trigger:** Job error rate exceeds 20% for 5 minutes
- **Description:** High percentage of job executions are failing

### JobErrorSpikeAbsolute
- **Severity:** Warning
- **Trigger:** Job error rate exceeds 0.5 errors/second for 5 minutes
- **Description:** High absolute count of errors (useful for low-traffic scenarios)

### JobRetryFlood
- **Severity:** Warning
- **Trigger:** Retry rate exceeds 1.0 retries/second for 5 minutes
- **Description:** Jobs are being retried at an unusually high rate

### JobRetryFloodAbsolute
- **Severity:** Critical
- **Trigger:** More than 50 retries in 10 minutes
- **Description:** Excessive retry count indicating critical persistent failures

## Metrics Exported

BagBot exports the following Prometheus metrics via `/api/metrics`:

- `bagbot_job_enqueue_total` - Total jobs enqueued (labels: job_path, result)
- `bagbot_job_run_total` - Total jobs run (labels: job_path, result)
- `bagbot_job_run_duration_seconds` - Job execution duration histogram (labels: job_path, result)
- `bagbot_retry_scheduled_total` - Total retries scheduled (labels: job_path)
- `bagbot_heartbeat_age_seconds` - Worker heartbeat age in seconds gauge (labels: worker_id)

## Threshold Tuning

The current thresholds are initial values and should be tuned after collecting 24 hours of staging data:

1. **WorkerHeartbeatStale (120s):** Adjust based on expected heartbeat interval and network latency
2. **JobErrorSpike (20%):** Tune based on acceptable error rate for your workload
3. **JobErrorSpikeAbsolute (0.5 errors/sec):** Adjust for your traffic volume
4. **JobRetryFlood (1.0 retries/sec):** Set based on normal retry patterns
5. **JobRetryFloodAbsolute (50 retries/10min):** Configure according to acceptable retry behavior

## Testing

To verify the metrics endpoint is working:

```bash
# Test staging endpoint
curl https://bagbot-backend.onrender.com/api/metrics

# Expected output includes:
# bagbot_heartbeat_age_seconds{worker_id="..."} ...
# bagbot_job_run_total{job_path="...",result="success"} ...
# bagbot_retry_scheduled_total{job_path="..."} ...
```

## Integration with Alertmanager

To receive alert notifications, configure Alertmanager in your `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'alertmanager:9093'
```

Then configure Alertmanager routes and receivers for BagBot alerts.

## Related

- PR #20: Worker orchestration + metrics implementation
- Backend metrics implementation: `backend/api/metrics.py`
- Worker metrics definitions: `backend/workers/metrics.py`
