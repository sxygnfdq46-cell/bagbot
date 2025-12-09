"""Shims to keep legacy ``bagbot`` imports working."""
from importlib import import_module
import sys
import types

__all__ = ["api", "optimizer", "trading", "com"]


def _alias(name: str, target: str):
    try:
        module = import_module(target)
    except Exception:
        module = types.ModuleType(name)
    sys.modules[f"bagbot.{name}"] = module
    return module

api = _alias("api", "api")
optimizer = _alias("optimizer", "optimizer")
try:
    trading = import_module("bagbot.trading")
except Exception:
    dummy = types.ModuleType("trading")
    dummy_scheduler = types.ModuleType("scheduler")
    dummy.scheduler = dummy_scheduler  # type: ignore[attr-defined]
    sys.modules["bagbot.trading"] = dummy
    sys.modules["bagbot.trading.scheduler"] = dummy_scheduler
    trading = dummy
else:
    if not hasattr(trading, "scheduler"):
        try:
            sched_mod = import_module("bagbot.trading.scheduler")
        except Exception:
            sched_mod = types.ModuleType("scheduler")
        trading.scheduler = sched_mod  # type: ignore[attr-defined]
        sys.modules.setdefault("bagbot.trading.scheduler", sched_mod)

# Ensure scheduler submodule is registered even if not already imported
if "bagbot.trading.scheduler" not in sys.modules:
    try:
        sys.modules["bagbot.trading.scheduler"] = import_module(
            "bagbot.trading.scheduler"
        )
        if hasattr(trading, "__dict__"):
            trading.scheduler = sys.modules["bagbot.trading.scheduler"]  # type: ignore[attr-defined]
    except Exception:
        pass
com = _alias("com", "backend.api")


def __getattr__(name: str):
    if name == "trading":
        return _alias("trading", "bagbot.trading")
    raise AttributeError(f"module 'bagbot' has no attribute {name}")
