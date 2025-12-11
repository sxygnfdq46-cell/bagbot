# Signals Staging Canary Runbook

**Owner:** Davis  
**Last Updated:** 2025-12-11  
**Milestone:** M8-A

---

## Overview

The signals ingest canary is a lightweight, reproducible test that verifies the entire signals ingestion pipeline from frame normalization through runtime decision execution. It runs in fake mode (no external services) and produces telemetry traces that can be validated for consistency.

**Key Components:**
- **Signals Ingest**: Normalizes raw signal frames into pipeline envelopes
- **Mock Feed**: Generates deterministic test signals for staging
- **Runtime Pipeline**: Executes brain → trade engine → runtime router → intent preview
- **Telemetry**: Captures spans (timing) and metrics (counters) for observability

**Canonical Local Trace ID:** `602734a1559a62c1`

---

## Environment Flags Reference

### Core Signals Flags

| Flag | Purpose | Values | Default |
|------|---------|--------|---------|
| `SIGNALS_INGEST_ENABLED` | Enable signals ingestion path | `1`, `true`, `yes`, `on` | disabled |
| `SIGNALS_MOCK_FEED_ENABLED` | Enable mock feed for testing | `1`, `true`, `yes`, `on` | disabled |
| `SIGNALS_FAKE_MODE` | Force fake snapshots in signals layer | `1`, `true`, `yes`, `on` | disabled |

### Pipeline Fake Mode Flags

These flags ensure no external services are called during staging tests:

| Flag | Purpose | Values | Default |
|------|---------|--------|---------|
| `BRAIN_FAKE_MODE` | Bypass brain adapter, return deterministic decision | `1`, `true`, `yes`, `on` | disabled |
| `TRADE_ENGINE_FAKE_MODE` | Bypass trade engine, return fake action | `1`, `true`, `yes`, `on` | disabled |
| `RUNTIME_ROUTER_FAKE_MODE` | Bypass execution router, return fake result | `1`, `true`, `yes`, `on` | disabled |
| `INTENT_PREVIEW_FAKE_MODE` | Bypass intent preview, return fake preview | `1`, `true`, `yes`, `on` | disabled |
| `INTENT_PREVIEW_ENABLED` | Enable intent preview stage in pipeline | `1`, `true`, `yes`, `on` | disabled |

**Important:** All fake mode flags must be enabled for staging canary to run safely without network calls or adapter dependencies.

---

## Running the Staging Canary Locally

### Prerequisites

1. Python 3.9+ installed
2. Repository dependencies installed: `pip install -r requirements.txt`
3. Working directory: `/home/runner/work/bagbot/bagbot` (or your local clone)

### Step 1: Set Environment Flags

```bash
export SIGNALS_INGEST_ENABLED=1
export SIGNALS_MOCK_FEED_ENABLED=1
export SIGNALS_FAKE_MODE=1
export BRAIN_FAKE_MODE=1
export TRADE_ENGINE_FAKE_MODE=1
export RUNTIME_ROUTER_FAKE_MODE=1
export INTENT_PREVIEW_FAKE_MODE=1
export INTENT_PREVIEW_ENABLED=1
```

**Alternative:** Use inline environment variables in the Python command (see Step 2).

### Step 2: Run the Canary

Execute the following Python script inline:

```bash
PYTHONPATH="$PWD" python - <<'PY'
import json
from backend.worker.runtime_pipeline import run_pipeline_canary

# Run the canary in fake mode
resp = run_pipeline_canary(fake_mode=True)

# Extract key fields
status = resp.get("status")
router_trace = (resp.get("router_result") or {}).get("meta", {}).get("trace_id")
meta_trace = (resp.get("meta") or {}).get("trace_id")

# Validate success
if status != "success":
    raise SystemExit(f"canary failed: status={status}")
if not router_trace:
    raise SystemExit("canary missing router trace id")
if meta_trace != router_trace:
    raise SystemExit("canary trace mismatch between router and meta")

# Write staging_canary.json
with open("staging_canary.json", "w") as f:
    json.dump(resp, f, indent=2, sort_keys=True)

print(f"✅ CANARY status={status} trace_id={router_trace}")
PY
```

### Step 3: Verify Output

**Expected Console Output:**
```
✅ CANARY status=success trace_id=<16-char-hex>
```

**Generated File:** `staging_canary.json` (see interpretation guide below)

---

## Interpreting staging_canary.json

The canary writes a complete JSON artifact containing the full pipeline response. Here's how to validate it:

### Essential Fields

```json
{
  "status": "success",
  "router_result": {
    "status": "success",
    "order_id": "abc123...",
    "meta": {
      "fake": true,
      "trace_id": "602734a1559a62c1"
    }
  },
  "meta": {
    "pipeline_fake_mode": true,
    "intent_preview_enabled": true,
    "trace_id": "602734a1559a62c1",
    "ingest": { ... },
    "mock_feed": { ... }
  }
}
```

### Validation Checklist

- [ ] **Top-level `status`**: Must be `"success"`
- [ ] **Trace ID Consistency**: `router_result.meta.trace_id` == `meta.trace_id`
- [ ] **Fake Mode Enabled**: `meta.pipeline_fake_mode` == `true`
- [ ] **Router Result**: `router_result.status` == `"success"`
- [ ] **Ingest Path** (if `SIGNALS_INGEST_ENABLED=1`): `meta.ingest.status` == `"success"`
- [ ] **Mock Feed Path** (if `SIGNALS_MOCK_FEED_ENABLED=1`): `meta.mock_feed.status` == `"success"`
- [ ] **Brain Decision**: `brain_decision.action` in `["buy", "sell", "hold"]`
- [ ] **Trade Action**: `trade_action.action` matches `brain_decision.action`
- [ ] **Intent Preview** (if enabled): `intent_preview.action` matches `brain_decision.action`

### Ingest Telemetry (Optional)

If `SIGNALS_INGEST_ENABLED=1`, check `meta.ingest.telemetry`:

```json
{
  "meta": {
    "ingest": {
      "status": "success",
      "telemetry": {
        "spans": [
          {"name": "ingest_frame", "duration_ms": 0.123}
        ],
        "metrics": [
          {"name": "signals.ingest.invocations_total", "labels": {"outcome": "success", "path": "ingest_frame"}}
        ]
      }
    }
  }
}
```

**Validation:**
- [ ] `telemetry.spans` contains `"ingest_frame"` span
- [ ] `telemetry.metrics` contains `"signals.ingest.invocations_total"` with `outcome: success`
- [ ] Span `duration_ms` is a positive number (typically < 10ms for fake mode)

---

## Verifying Telemetry Spans and Metrics

### Spans (Timing Data)

Spans capture execution timing in milliseconds. The ingest path records spans for:
- `ingest_frame` (when `SIGNALS_INGEST_ENABLED=1`)
- `consume_signal` (used by mock feed)

**Location in JSON:**
```json
meta.ingest.telemetry.spans[0] = {"name": "ingest_frame", "duration_ms": 0.123}
```

**What to Check:**
- Span exists with correct `name`
- `duration_ms` is a positive float (indicates successful execution)
- Typical fake-mode duration: < 10ms

### Metrics (Counters)

Metrics track invocation counts and outcomes. Key metrics:
- `signals.ingest.invocations_total` (labels: `outcome`, `path`)
- `signals_mock_feed_runs_total` (labels: `outcome`)
- `pipeline_requests_total` (labels: `stage`, `outcome`)

**Location in JSON:**
```json
meta.ingest.telemetry.metrics = [
  {
    "name": "signals.ingest.invocations_total",
    "labels": {"outcome": "success", "path": "ingest_frame"}
  }
]
```

**What to Check:**
- Metrics array is non-empty
- Each metric has a `name` and `labels` object
- `outcome` label is `"success"` (not `"error"`)
- `path` label matches the code path taken (`"ingest_frame"` or `"consume_signal"`)

**Note:** Metrics are recorded both in the telemetry container (for inspection) and forwarded to the metrics client (e.g., Prometheus) if one is provided.

---

## GitHub Actions CI Pipeline

The signals staging canary runs as part of the CI pipeline on every push and pull request.

### Relevant CI Job: `pipeline-signals-ingest-canary`

**Workflow File:** `.github/workflows/ci.yml`

**Job Definition:**
```yaml
pipeline-signals-ingest-canary:
  runs-on: ubuntu-latest
  needs: [backup-artifacts-check, payments-import-check, ...]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: "3.9"
    - name: Install deps
      run: |
        pip install --upgrade pip
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
        pip install "pycares>=4,<5"
        pip install pytest
    - name: Run staging ingest canary (fake modes + telemetry)
      env:
        SIGNALS_INGEST_ENABLED: "1"
        SIGNALS_MOCK_FEED_ENABLED: "1"
        SIGNALS_FAKE_MODE: "1"
        BRAIN_FAKE_MODE: "1"
        TRADE_ENGINE_FAKE_MODE: "1"
        RUNTIME_ROUTER_FAKE_MODE: "1"
        INTENT_PREVIEW_FAKE_MODE: "1"
        INTENT_PREVIEW_ENABLED: "1"
      run: |
        PYTHONPATH="$PWD" python - <<'PY'
        import json
        from backend.worker.runtime_pipeline import run_pipeline_canary
        
        resp = run_pipeline_canary(fake_mode=True)
        status = resp.get("status")
        router_trace = (resp.get("router_result") or {}).get("meta", {}).get("trace_id")
        meta_trace = (resp.get("meta") or {}).get("trace_id")
        
        if status != "success":
          raise SystemExit(f"canary failed: status={status}")
        if not router_trace:
          raise SystemExit("canary missing router trace id")
        if meta_trace != router_trace:
          raise SystemExit("canary trace mismatch between router and meta")
        
        with open("staging_canary.json", "w") as f:
          json.dump(resp, f, indent=2, sort_keys=True)
        
        print(f"CANARY status={status} trace_id={router_trace}")
        PY
    - name: Upload staging canary artifact
      uses: actions/upload-artifact@v4
      with:
        name: staging-canary-json
        path: staging_canary.json
        if-no-files-found: error
```

---

## Reading CI Job Logs and Artifacts

### Step 1: Navigate to the Actions Tab

1. Go to the repository on GitHub
2. Click the **"Actions"** tab
3. Select the relevant workflow run (triggered by your commit/PR)

### Step 2: Find the Canary Job

1. Expand the **`pipeline-signals-ingest-canary`** job in the workflow summary
2. Click on the job name to view detailed logs

### Step 3: Inspect the Logs

**What to Look For:**

✅ **Success Pattern:**
```
CANARY status=success trace_id=602734a1559a62c1
```

❌ **Failure Patterns:**
- `canary failed: status=hold` → Pipeline stage failed
- `canary missing router trace id` → Trace propagation broken
- `canary trace mismatch between router and meta` → Trace inconsistency

**Common Errors:**
- **Import Errors**: Missing dependencies or import-safety violations
- **Environment Flag Errors**: Fake mode not enabled, causing network calls
- **Validation Errors**: Missing fields in pipeline response

### Step 4: Download Artifacts

1. Scroll to the bottom of the workflow run page
2. Find **"Artifacts"** section
3. Download **`staging-canary-json`** artifact
4. Unzip and inspect `staging_canary.json` using the interpretation guide above

**Artifact Contents:**
- `staging_canary.json`: Full pipeline response with telemetry

---

## Approving Blocked Workflows in GitHub Actions

Some workflows may require manual approval before running, especially for:
- First-time contributors
- Workflows with deployment steps
- Workflows requiring secrets access

### How to Approve a Workflow

1. **Navigate to Actions Tab**
   - Go to your repository on GitHub
   - Click **"Actions"** tab

2. **Find Pending Workflow**
   - Look for workflow runs with a yellow "Waiting" or "Approval Required" badge
   - Click on the workflow run to open details

3. **Review the Workflow**
   - Check which job is pending approval
   - Review the workflow configuration to ensure it's safe
   - Verify the requester is authorized

4. **Approve or Reject**
   - Click **"Review pending deployments"** button (if it's a deployment)
   - Or click **"Approve and run"** button for first-time contributors
   - Optionally add a comment explaining your decision

5. **Monitor Execution**
   - After approval, the workflow will resume
   - Follow the "Reading CI Job Logs" section to monitor progress

**Security Note:** Only approve workflows from trusted sources. Review changes to workflow files before approving.

---

## Promotion to Higher Environments

### Staging → Production Promotion Checklist

Before promoting the signals ingest canary to production:

- [ ] **Staging Canary Passes**: All CI runs pass with `status=success`
- [ ] **Trace Consistency Verified**: `router_result.meta.trace_id == meta.trace_id`
- [ ] **Telemetry Validated**: Spans and metrics present in `staging_canary.json`
- [ ] **No Import Errors**: All import-check jobs pass
- [ ] **Fake Mode Confirmed**: `meta.pipeline_fake_mode == true` in staging
- [ ] **Mock Feed Tested**: `meta.mock_feed.status == "success"` when enabled
- [ ] **Ingest Path Tested**: `meta.ingest.status == "success"` when enabled
- [ ] **Code Review Approved**: At least one reviewer approves the PR
- [ ] **No Security Vulnerabilities**: CodeQL and security scans pass

### Environment Flag Changes for Production

**Staging (fake mode):**
```bash
SIGNALS_INGEST_ENABLED=1
SIGNALS_FAKE_MODE=1
BRAIN_FAKE_MODE=1
TRADE_ENGINE_FAKE_MODE=1
RUNTIME_ROUTER_FAKE_MODE=1
INTENT_PREVIEW_FAKE_MODE=1
INTENT_PREVIEW_ENABLED=1
```

**Production (real mode):**
```bash
SIGNALS_INGEST_ENABLED=1
SIGNALS_FAKE_MODE=0  # or unset
BRAIN_FAKE_MODE=0    # or unset
TRADE_ENGINE_FAKE_MODE=0  # or unset
RUNTIME_ROUTER_FAKE_MODE=0  # or unset
INTENT_PREVIEW_FAKE_MODE=0  # or unset
INTENT_PREVIEW_ENABLED=1
```

**Critical:** Remove or disable ALL fake mode flags before production deployment. Production should connect to real brain adapter, trade engine, and execution router.

---

## M8-A Acceptance Criteria

### ✅ Runbook Completeness

- [x] Environment flags documented with descriptions and default values
- [x] Local canary execution instructions provided
- [x] `staging_canary.json` interpretation guide included
- [x] Telemetry spans/metrics verification steps documented
- [x] GitHub Actions workflow approval process explained
- [x] CI job logs and artifacts reading guide included

### ✅ Owner Assignment

- [x] Owner: Davis

### 🔲 M8-B Follow-up Tasks (Telemetry Metrics Forwarding)

- [ ] Integrate Prometheus metrics client for production
- [ ] Configure metric forwarding to observability backend (e.g., Grafana)
- [ ] Add alerting rules for canary failures
- [ ] Create dashboard for signals ingest telemetry
- [ ] Document metrics retention and querying

### 🔲 M7 Follow-up Tasks

- [ ] Review M7 deliverables and ensure compatibility with M8
- [ ] Verify trace propagation in M7 components
- [ ] Update M7 documentation to reference M8 runbook

---

## Troubleshooting

### Common Issues

#### 1. Canary fails with `status=hold`

**Symptom:** `staging_canary.json` shows `"status": "hold"`

**Possible Causes:**
- Mock feed disabled or failed
- Ingest path failed
- Pipeline stage exception

**Solution:**
- Check `meta.mock_feed` or `meta.ingest` for error details
- Verify all fake mode flags are set
- Review logs for exceptions

#### 2. Missing trace_id

**Symptom:** `canary missing router trace id` error

**Possible Causes:**
- Router stage failed before generating trace
- Fake mode not enabled (router didn't execute)

**Solution:**
- Verify `RUNTIME_ROUTER_FAKE_MODE=1` is set
- Check `router_result` field in output for errors

#### 3. Trace mismatch

**Symptom:** `canary trace mismatch between router and meta`

**Possible Causes:**
- Trace propagation bug
- Multiple traces generated

**Solution:**
- Verify trace extraction logic in `runtime_pipeline.py`
- Check `router_result.meta.trace_id` and `meta.trace_id` match

#### 4. Telemetry missing

**Symptom:** `meta.ingest.telemetry` is empty or missing

**Possible Causes:**
- Telemetry not enabled (pass `telemetry={}` to `ingest_frame`)
- Ingest path not taken

**Solution:**
- Ensure `SIGNALS_INGEST_ENABLED=1` is set
- Verify `run_pipeline_canary` passes telemetry container

---

## Related Documentation

- **M6 Release Notes:** `docs/release-notes/m6-signals-mock-feed.md`
- **CI Workflow:** `.github/workflows/ci.yml`
- **Signals Ingest Implementation:** `backend/signals/ingest.py`
- **Mock Feed Implementation:** `backend/signals/mock_feed.py`
- **Telemetry Helpers:** `backend/signals/telemetry.py`
- **Runtime Pipeline:** `backend/worker/runtime_pipeline.py`
- **Tests:**
  - `tests/test_signals_ingest.py`
  - `tests/test_signals_pipeline_canary.py`
  - `tests/test_signals_telemetry.py`

---

## Changelog

- **2025-12-11:** Initial runbook created for M8-A (Davis)
