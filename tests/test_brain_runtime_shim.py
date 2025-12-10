import os
import subprocess
import sys
from pathlib import Path

from backend.worker import runner


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels))


def test_get_brain_decision_forwards_adapter(monkeypatch):
    calls = {}

    def fake_decide(signals, config=None, metrics_client=None, fake_mode=False):
        calls["signals"] = signals
        calls["config"] = config
        calls["metrics_client"] = metrics_client
        calls["fake_mode"] = fake_mode
        return {
            "action": "buy",
            "confidence": 0.8,
            "rationale": ["forwarded"],
            "meta": {"source": "fake-decide"},
        }

    class FakeAdapter:
        decide = staticmethod(fake_decide)

    monkeypatch.delenv("BRAIN_FAKE_MODE", raising=False)
    metrics = _StubMetrics()

    decision = runner.get_brain_decision(
        {"demo": {"strength": 1.0}},
        config={"threshold": 0.2},
        metrics_client=metrics,
        adapter_module=FakeAdapter,
    )

    assert decision["action"] == "buy"
    assert calls["signals"]["demo"]["strength"] == 1.0
    assert calls["config"]["threshold"] == 0.2
    assert calls["metrics_client"] is metrics
    assert calls["fake_mode"] is False


def test_import_backend_worker_runner_is_safe(monkeypatch, tmp_path):
    root = Path(__file__).resolve().parents[2]
    env = os.environ.copy()
    env["PYTHONPATH"] = os.pathsep.join(
        [str(root), env.get("PYTHONPATH", "")] if env.get("PYTHONPATH") else [str(root)]
    )
    env["BRAIN_FAKE_MODE"] = "1"
    subprocess.check_call(
        [sys.executable, "-c", "import backend.worker.runner"],
        env=env,
        cwd=root,
    )


def test_smoke_fake_mode(monkeypatch):
    metrics = _StubMetrics()
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")

    decision = runner.get_brain_decision(
        {"demo": {"type": "momentum", "strength": 0.4}},
        config={"threshold": 0.3},
        metrics_client=metrics,
    )

    assert set(decision.keys()) >= {"action", "confidence", "rationale", "meta"}
    assert decision["action"] == "hold"
    assert decision["meta"].get("source") == "fake"
    assert ("brain_decisions_total", {"action": "hold"}) in metrics.calls
