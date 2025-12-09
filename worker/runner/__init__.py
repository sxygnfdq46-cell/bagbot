"""Expose runner helpers even when this directory shadows ``runner.py``."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

_impl_path = Path(__file__).resolve().parent.parent / "runner.py"
_spec = spec_from_file_location("worker._runner_impl", _impl_path)
if _spec and _spec.loader:
	_mod = module_from_spec(_spec)
	_spec.loader.exec_module(_mod)  # type: ignore[misc]
	sys.modules.setdefault("worker._runner_impl", _mod)
else:  # pragma: no cover
	_mod = None  # type: ignore

if _mod:
	run_once_or_process_all = getattr(_mod, "run_once_or_process_all", None)
else:  # pragma: no cover
	run_once_or_process_all = None  # type: ignore

__all__ = ["run_once_or_process_all"]
