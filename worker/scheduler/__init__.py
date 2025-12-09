"""Expose scheduler objects even when this directory shadows ``scheduler.py``.

This package loader forwards imports to the actual implementation in
``worker/scheduler.py`` so ``from worker.scheduler import DailyCycleScheduler``
works regardless of whether Python resolves the package or module first.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

_impl_path = Path(__file__).resolve().parent.parent / "scheduler.py"
_spec = spec_from_file_location("worker._scheduler_impl", _impl_path)
if _spec and _spec.loader:
	_mod = module_from_spec(_spec)
	_spec.loader.exec_module(_mod)  # type: ignore[misc]
	sys.modules.setdefault("worker._scheduler_impl", _mod)
else:  # pragma: no cover - fallback safety
	_mod = None  # type: ignore

if _mod:
	DailyCycleScheduler = getattr(_mod, "DailyCycleScheduler", None)
	run_daily_cycle = getattr(_mod, "run_daily_cycle", None)
else:  # pragma: no cover - fallback placeholders
	DailyCycleScheduler = None  # type: ignore
	run_daily_cycle = None  # type: ignore

__all__ = ["DailyCycleScheduler", "run_daily_cycle"]
