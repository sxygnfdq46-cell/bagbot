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


class Metrics:
    def __init__(self) -> None:
        self.worker_jobs_enqueued_total = Counter()
        self.worker_jobs_started_total = Counter()
        self.worker_jobs_done_total = Counter()
        self.worker_jobs_failed_total = Counter()
        self.worker_jobs_retried_total = Counter()
        self.worker_job_duration_seconds = Histogram()


default_metrics = Metrics()
