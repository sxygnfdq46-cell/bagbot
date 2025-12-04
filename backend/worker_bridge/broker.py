"""Worker broker placeholder for orchestrating long-running tasks."""
from __future__ import annotations

from typing import Any


class WorkerBroker:
    """Coordinates background worker actions (placeholder)."""

    async def dispatch(self, job: dict[str, Any]) -> None:
        """TODO: dispatch a job to the worker."""
        raise NotImplementedError

    async def status(self, job_id: str) -> dict[str, Any]:
        """TODO: query job status."""
        raise NotImplementedError
