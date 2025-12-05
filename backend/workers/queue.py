"""Queue stubs for tests."""
from typing import Any


def enqueue_task(func_path: str, *args: Any, **kwargs: Any) -> str:
    return "job-queued"
