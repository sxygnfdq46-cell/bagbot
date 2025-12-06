from __future__ import annotations

from typing import List


class Counter:
    def __init__(self) -> None:
        self.count = 0

    def inc(self, value: int = 1) -> None:
        self.count += value


class Histogram:
    def __init__(self) -> None:
        self.values: List[float] = []

    def observe(self, value: float) -> None:
        self.values.append(value)


class Gauge:
    def __init__(self) -> None:
        self.value: float | int = 0

    def set(self, value: float | int) -> None:
        self.value = value


class Metrics:
    def __init__(self) -> None:
        self.worker_jobs_enqueued_total = Counter()
        self.worker_jobs_started_total = Counter()
        self.worker_jobs_done_total = Counter()
        self.worker_jobs_failed_total = Counter()
        self.worker_jobs_retried_total = Counter()
        self.worker_job_duration_seconds = Histogram()
        self.worker_retry_triggered_total = Counter()
        self.worker_queue_length = Gauge()
        self.worker_jobs_running = Gauge()
        self.worker_jobs_stuck = Gauge()
        self.worker_latest_heartbeat_age_ms = Gauge()


default_metrics = Metrics()
