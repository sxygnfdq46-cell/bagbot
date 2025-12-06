from __future__ import annotations

from typing import List

from prometheus_client import Counter, Gauge, Histogram


# Prometheus-facing metrics (exported to /metrics)
job_enqueue_total = Counter(
    "bagbot_job_enqueue_total",
    "Jobs enqueued",
    ["job_path", "result"],
)
job_run_total = Counter(
    "bagbot_job_run_total",
    "Jobs run",
    ["job_path", "result"],
)
job_run_duration_seconds = Histogram(
    "bagbot_job_run_duration_seconds",
    "Job run duration seconds",
    ["job_path", "result"],
)
retry_scheduled_total = Counter(
    "bagbot_retry_scheduled_total",
    "Retries scheduled",
    ["job_path"],
)
heartbeat_age_seconds = Gauge(
    "bagbot_heartbeat_age_seconds",
    "Last heartbeat age seconds",
    ["worker_id"],
)


# Lightweight in-memory metrics used by existing tests
class _Counter:
    def __init__(self) -> None:
        self.count = 0

    def inc(self, value: int = 1) -> None:
        self.count += value


class _Histogram:
    def __init__(self) -> None:
        self.values: List[float] = []

    def observe(self, value: float) -> None:
        self.values.append(value)


class _Gauge:
    def __init__(self) -> None:
        self.value: float | int = 0

    def set(self, value: float | int) -> None:
        self.value = value


class Metrics:
    def __init__(self) -> None:
        self.worker_jobs_enqueued_total = _Counter()
        self.worker_jobs_started_total = _Counter()
        self.worker_jobs_done_total = _Counter()
        self.worker_jobs_failed_total = _Counter()
        self.worker_jobs_retried_total = _Counter()
        self.worker_job_duration_seconds = _Histogram()
        self.worker_retry_triggered_total = _Counter()
        self.worker_queue_length = _Gauge()
        self.worker_jobs_running = _Gauge()
        self.worker_jobs_stuck = _Gauge()
        self.worker_latest_heartbeat_age_ms = _Gauge()


default_metrics = Metrics()
