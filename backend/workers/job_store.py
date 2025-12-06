from __future__ import annotations

import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple, Union

# Redis is optional for local/test; guarded import keeps memory-only mode light
try:
    from backend.workers.redis_job_store import RedisJobStore
except Exception:  # pragma: no cover - optional dependency path
    RedisJobStore = None


class JobRecord:
    def __init__(self) -> None:
        self.state: str = "unknown"  # enqueued|running|done|error
        self.attempts: int = 0
        self.last_error: Optional[str] = None
        self.updated_at: float = time.time()
        self.next_retry_at: Optional[float] = None
        self.last_job: Optional[Dict] = None


class JobStore:
    """
    Simple thread-safe in-memory job store.
    API is synchronous to be easy to call from sync or async code.
    Replaceable later with a Redis/DB-backed implementation.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._store: Dict[str, JobRecord] = {}

    def _ensure(self, job_id: str) -> JobRecord:
        with self._lock:
            record = self._store.get(job_id)
            if record is None:
                record = JobRecord()
                record.state = "enqueued"
                self._store[job_id] = record
            return record

    def claim(self, job_id: str) -> bool:
        """
        Try to atomically claim the job for running.
        Returns True if claimed (enqueued/error/unknown), False if already
        running or done.
        """

        with self._lock:
            record = self._store.get(job_id)
            if record is None:
                record = JobRecord()
                record.state = "running"
                record.attempts = 1
                record.updated_at = time.time()
                self._store[job_id] = record
                return True

            if record.state == "running":
                return False
            if record.state == "done":
                return False

            previous_state = record.state
            record.state = "running"
            if previous_state != "retry_scheduled":
                record.attempts += 1
            record.updated_at = time.time()
            return True

    def set_state(
        self,
        job_id: str,
        state: str,
        last_error: Optional[str] = None,
    ) -> None:
        with self._lock:
            record = self._ensure(job_id)
            record.state = state
            record.updated_at = time.time()
            if last_error is not None:
                record.last_error = last_error
            if state != "retry_scheduled":
                record.next_retry_at = None

    def set_last_job(self, job_id: str, job: Dict) -> None:
        with self._lock:
            record = self._ensure(job_id)
            record.last_job = job.copy()

    def get_state(self, job_id: str) -> Optional[str]:
        with self._lock:
            record = self._store.get(job_id)
            return record.state if record else None

    def increment_attempts(self, job_id: str) -> int:
        with self._lock:
            record = self._ensure(job_id)
            record.attempts += 1
            record.updated_at = time.time()
            return record.attempts

    def schedule_retry(self, job_id: str, epoch_ms: float) -> None:
        with self._lock:
            record = self._ensure(job_id)
            record.state = "retry_scheduled"
            record.next_retry_at = epoch_ms
            record.updated_at = time.time()

    def next_retry_jobs(self, now_ms: float) -> List[Tuple[str, Dict]]:
        with self._lock:
            due: List[Tuple[str, Dict]] = []
            for job_id, record in self._store.items():
                if record.next_retry_at is None:
                    continue
                if record.next_retry_at <= now_ms:
                    record.next_retry_at = None
                    if record.last_job:
                        due.append((job_id, record.last_job.copy()))
            return due

    def attempts(self, job_id: str) -> int:
        with self._lock:
            record = self._store.get(job_id)
            return record.attempts if record else 0

    def reset(self, job_id: str) -> None:
        with self._lock:
            if job_id in self._store:
                del self._store[job_id]

    def dump(self) -> Dict[str, Dict]:
        """Helper for tests / debugging: shallow snapshot."""

        with self._lock:
            return {
                key: {
                    "state": value.state,
                    "attempts": value.attempts,
                    "last_error": value.last_error,
                    "next_retry_at": value.next_retry_at,
                    "updated_at": value.updated_at,
                }
                for key, value in self._store.items()
            }


def get_default_store() -> Union[JobStore, Any]:
    backend = os.getenv("JOB_STORE", "memory").lower()
    if backend == "redis" and RedisJobStore is not None:
        return RedisJobStore(redis_url=os.getenv("REDIS_URL"))
    return JobStore()


default_store = get_default_store()
