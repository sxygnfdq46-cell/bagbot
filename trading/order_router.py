"""Thin re-export for legacy imports of the worker order router."""

from worker.executor.order_router import *  # noqa: F401,F403 - re-export intentionally

try:
    from worker.executor import order_router as _impl

    __all__ = getattr(_impl, "__all__", [])
except Exception:  # pragma: no cover - defensive fallback
    __all__ = []
