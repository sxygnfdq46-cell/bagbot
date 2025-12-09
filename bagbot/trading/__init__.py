"""Shims exposing trading modules under the ``bagbot.trading`` namespace."""

from importlib import import_module
import sys
import types

__all__ = [
    "scheduler",
    "mindset",
    "order_router",
]


def _alias(name: str, target: str):
    try:
        module = import_module(target)
    except Exception:
        module = types.ModuleType(name)
    sys.modules[f"bagbot.trading.{name}"] = module
    return module


def _load_scheduler():
    """Prefer the real scheduler implementation if available."""
    try:
        # Import the package first so worker._scheduler_impl is populated
        import_module("worker.scheduler")
        module = sys.modules.get("worker._scheduler_impl")
        if module is None:
            module = import_module("worker._scheduler_impl")
    except Exception:
        try:
            module = import_module(".scheduler", __name__)
        except Exception:
            module = _alias("scheduler", "worker.scheduler")
    sys.modules["bagbot.trading.scheduler"] = module
    return module


scheduler = _load_scheduler()
mindset = _alias("mindset", "worker.mindset")
order_router = _alias("order_router", "worker.executor.order_router")
