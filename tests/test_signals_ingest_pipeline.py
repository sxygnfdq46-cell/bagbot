"""Pipeline canary when ingest is enabled."""

from backend.worker.runtime_pipeline import run_pipeline_canary


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):  # pragma: no cover - optional
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def test_pipeline_canary_with_ingest(monkeypatch):
    monkeypatch.setenv("SIGNALS_INGEST_ENABLED", "1")
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")

    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")

    metrics = _StubMetrics()

    resp = run_pipeline_canary(metrics_client=metrics, fake_mode=True)

    assert resp["status"] == "success"
    assert resp["router_result"]["meta"].get("trace_id")
    assert resp.get("meta", {}).get("ingest", {}).get("status") == "success"
