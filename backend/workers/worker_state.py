"""In-memory worker state tracker stub for Phase 2 groundwork."""
from __future__ import annotations

from datetime import datetime

_status = "offline"
_last_heartbeat = None
_last_job_id = None


def set_status(status: str) -> None:
    allowed = {"idle", "busy", "offline"}
    if status not in allowed:
        raise ValueError(f"status must be one of {sorted(allowed)}")
    global _status
    _status = status


def get_status() -> str:
    return _status


def update_heartbeat(ts: datetime | None = None) -> None:
    global _last_heartbeat
    _last_heartbeat = ts or datetime.utcnow()


def record_job(job_id: str) -> None:
    if not isinstance(job_id, str) or not job_id:
        raise ValueError("job_id must be a non-empty string")
    global _last_job_id
    _last_job_id = job_id
    set_status("busy")


def get_state() -> dict:
    return {
        "status": _status,
        "last_heartbeat": _last_heartbeat,
        "last_job_id": _last_job_id,
    }
