"""E2E-ish canary for runtime pipeline + mock feed."""

from backend.worker.runtime_pipeline import run_pipeline_canary


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_pipeline_canary_with_mock_feed(monkeypatch):
    monkeypatch.setenv("SIGNALS_MOCK_FEED_ENABLED", "1")
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")

    # Stage fake-mode envs remain optional since we force fake_mode=True below, but keep them explicit for clarity.
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")

    metrics = _StubMetrics()

    resp = run_pipeline_canary(metrics_client=metrics, fake_mode=True)

    assert resp["status"] == "success"
    assert resp["router_result"]["meta"].get("trace_id")
    assert resp["meta"].get("mock_feed", {}).get("status") == "success"
    assert _count(metrics.calls, "signals_mock_feed_runs_total") >= 1
