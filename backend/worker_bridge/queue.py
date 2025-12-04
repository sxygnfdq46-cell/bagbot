"""Async queue abstractions for worker orchestration."""
from __future__ import annotations

from typing import Any


class WorkerQueue:
    """Placeholder queue that will connect backend to the worker."""

    async def enqueue(self, task: dict[str, Any]) -> None:
        """TODO: push a task into the queue."""
        raise NotImplementedError

    async def dequeue(self) -> dict[str, Any]:
        """TODO: pull the next task from the queue."""
        raise NotImplementedError
