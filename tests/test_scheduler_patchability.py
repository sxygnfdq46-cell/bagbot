import asyncio
import importlib
import importlib.util
import sys
import threading
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _load_scheduler_module():
    try:
        return importlib.import_module("bagbot.trading.scheduler")
    except ModuleNotFoundError:
        module_path = ROOT / "bagbot" / "trading" / "scheduler.py"
        spec = importlib.util.spec_from_file_location("bagbot.trading.scheduler", module_path)
        if spec is None or spec.loader is None:
            raise ModuleNotFoundError("Unable to load bagbot.trading.scheduler")
        module = importlib.util.module_from_spec(spec)
        sys.modules["bagbot.trading.scheduler"] = module
        spec.loader.exec_module(module)
        return module


trading_scheduler = _load_scheduler_module()


class _DummyScheduler:
    def __init__(self, *args, **kwargs):
        self.called = False

    async def schedule_daily_cycle(self):
        self.called = True
        return {"status": "ok", "called": True}


@pytest.mark.asyncio
async def test_run_daily_cycle_uses_patched_scheduler(monkeypatch):
    monkeypatch.setattr(trading_scheduler, "DailyCycleScheduler", _DummyScheduler)
    result = await trading_scheduler.run_daily_cycle()
    assert result["called"] is True
    assert result["status"] == "ok"


@pytest.mark.asyncio
async def test_run_daily_cycle_patch_hook(monkeypatch):
    async def fake_run_daily_cycle(*args, **kwargs):
        return {"patched": True, "args": args, "kwargs": kwargs}

    monkeypatch.setattr(trading_scheduler, "run_daily_cycle", fake_run_daily_cycle)
    result = await trading_scheduler.run_daily_cycle(dry_run=True)
    assert result["patched"] is True


def test_imports_are_side_effect_free_for_scheduler(monkeypatch):
    before_threads = threading.active_count()
    monkeypatch.delenv("SCHEDULER_DRY_RUN", raising=False)
    sys.modules.pop("worker.scheduler", None)
    module_path = ROOT / "worker" / "scheduler.py"
    spec = importlib.util.spec_from_file_location("worker.scheduler", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["worker.scheduler"] = module
    spec.loader.exec_module(module)
    after_threads = threading.active_count()
    assert after_threads == before_threads


def test_worker_queue_import_safe(monkeypatch):
    before_threads = threading.active_count()
    sys.modules.pop("worker.queue", None)
    module_path = ROOT / "worker" / "queue.py"
    spec = importlib.util.spec_from_file_location("worker.queue", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["worker.queue"] = module
    spec.loader.exec_module(module)
    after_threads = threading.active_count()
    assert after_threads == before_threads
