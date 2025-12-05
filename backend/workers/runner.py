import importlib
from typing import Any

from backend.services.strategy_registry import load_default_registry
from backend.workers import queue


def run_job(path: str, *args: Any, **kwargs: Any):
    module_path, fn = path.rsplit(".", 1)
    mod = importlib.import_module(module_path)
    return getattr(mod, fn)(*args, **kwargs)


def route_job(strategy_id: str, action: str = "started") -> str:
    registry = load_default_registry()
    meta = registry.get(strategy_id) or registry.get("default")
    job_path = (
        meta.job_path if meta else "backend.workers.tasks.strategy_toggle"
    )
    return queue.enqueue_task(job_path, strategy_id, action)


__all__ = ["run_job", "route_job"]
