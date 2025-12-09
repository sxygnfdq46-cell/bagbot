import sys
import types
from unittest.mock import Mock
from pathlib import Path
import os

import pytest

# Ensure scheduler shim is discoverable via worker.scheduler before tests import modules
try:
    import bagbot.trading.scheduler as _scheduler_shim
    sys.modules.setdefault("worker.scheduler", _scheduler_shim)
    sys.modules.setdefault("bagbot.trading.scheduler", _scheduler_shim)
except Exception:
    pass


def _make_fake_worker():
    """Create a simple fake ``worker`` package with .queue and .tasks submodules."""

    worker = types.ModuleType("worker")

    queue_mod = types.ModuleType("worker.queue")
    queue_mod.enqueue = Mock()
    queue_mod.dequeue = Mock()

    tasks_mod = types.ModuleType("worker.tasks")
    tasks_mod.schedule = Mock()
    tasks_mod.run = Mock()

    worker.queue = queue_mod
    worker.tasks = tasks_mod

    return worker, queue_mod, tasks_mod


@pytest.fixture
def mocked_worker(monkeypatch):
    """Provide a fake ``worker`` package for tests that explicitly request it."""

    worker, queue_mod, tasks_mod = _make_fake_worker()
    monkeypatch.setitem(sys.modules, "worker", worker)
    monkeypatch.setitem(sys.modules, "worker.queue", queue_mod)
    monkeypatch.setitem(sys.modules, "worker.tasks", tasks_mod)
    return worker


@pytest.fixture(scope="session", autouse=True)
def _chdir_to_tests():
    """Ensure relative paths in tests resolve from the tests directory."""

    tests_dir = Path(__file__).parent
    os.chdir(tests_dir)
    project_root = tests_dir.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Reset environment flags that can leak between tests."""

    for key in [
        "SCHEDULER_DRY_RUN",
        "ENABLE_REPORT_WEBHOOK",
        "MAX_ORDER_USD",
        "MAX_POSITION_USD",
        "TRADINGVIEW_SECRET",
    ]:
        monkeypatch.delenv(key, raising=False)

    # Provide stable admin token default for admin route tests
    monkeypatch.setenv("ADMIN_TOKEN", "test-admin-token-123")


@pytest.fixture(autouse=True)
def _auto_worker(monkeypatch):
    """Autouse fixture ensuring a minimal fake ``worker`` package exists for all tests."""

    worker, queue_mod, tasks_mod = _make_fake_worker()
    monkeypatch.setitem(sys.modules, "worker", worker)
    monkeypatch.setitem(sys.modules, "worker.queue", queue_mod)
    monkeypatch.setitem(sys.modules, "worker.tasks", tasks_mod)
    return worker


@pytest.fixture(autouse=True)
def _ensure_bagbot_trading(monkeypatch):
    """Guarantee bagbot.trading.scheduler is importable for patched tests."""

    import importlib
    from pathlib import Path
    import importlib.util

    trading_mod = importlib.import_module("bagbot.trading")

    scheduler_mod = (
        sys.modules.get("worker._scheduler_impl")
        or sys.modules.get("worker.scheduler")
    )

    if scheduler_mod is None:
        worker_mod = sys.modules.get("worker")
        if worker_mod is not None and not hasattr(worker_mod, "__path__"):
            # Worker has been monkeypatched to a simple module; use the local shim to avoid import errors
            scheduler_path = Path(__file__).parent.parent / "bagbot" / "trading" / "scheduler.py"
            spec = importlib.util.spec_from_file_location(
                "bagbot.trading.scheduler", scheduler_path
            )
        else:
            scheduler_path = Path(__file__).parent.parent / "worker" / "scheduler.py"
            spec = importlib.util.spec_from_file_location(
                "worker._scheduler_impl", scheduler_path
            )
        scheduler_mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        assert spec and spec.loader
        monkeypatch.setitem(sys.modules, spec.name, scheduler_mod)
        spec.loader.exec_module(scheduler_mod)  # type: ignore[arg-type]
        if spec.name == "worker._scheduler_impl":
            monkeypatch.setitem(sys.modules, "worker._scheduler_impl", scheduler_mod)

    # Ensure consistent aliases for patching and imports
    monkeypatch.setitem(sys.modules, "bagbot.trading", trading_mod)
    monkeypatch.setitem(sys.modules, "bagbot.trading.scheduler", scheduler_mod)
    monkeypatch.setitem(sys.modules, "worker.scheduler", scheduler_mod)
    setattr(trading_mod, "scheduler", scheduler_mod)
    return trading_mod
