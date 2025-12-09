"""Legacy ``trading`` namespace bridging to worker.executor modules."""

from importlib import import_module
import sys
import types

__all__ = ["order_router"]


def _alias(name: str, target: str):
    try:
        module = import_module(target)
    except Exception:
        module = types.ModuleType(name)
    sys.modules[f"trading.{name}"] = module
    return module

order_router = _alias("order_router", "worker.executor.order_router")
