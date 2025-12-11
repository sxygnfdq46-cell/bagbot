"""Unit coverage for signals mock feed utilities."""

from backend.signals.mock_feed import mock_frame, run_mock_feed_once


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_mock_frame_defaults():
    frame = mock_frame()
    assert frame["instrument"] == "BTC-USD"
    assert frame["features"]["price"] == 10000.0
    assert frame["features"]["signal_strength"] == 0.9
    assert frame["raw"]["source"] == "mock_feed"


def test_mock_feed_disabled(monkeypatch):
    monkeypatch.delenv("SIGNALS_MOCK_FEED_ENABLED", raising=False)
    monkeypatch.delenv("SIGNALS_FAKE_MODE", raising=False)
    metrics = _StubMetrics()

    resp = run_mock_feed_once(metrics_client=metrics)

    assert resp["status"] == "skipped"
    assert _count(metrics.calls, "signals_mock_feed_runs_total", outcome="skipped") == 1


def test_mock_feed_runs(monkeypatch):
    monkeypatch.setenv("SIGNALS_MOCK_FEED_ENABLED", "1")
    metrics = _StubMetrics()

    resp = run_mock_feed_once(metrics_client=metrics)

    assert resp["status"] == "success"
    assert resp["router_result"]["meta"].get("trace_id")
    assert _count(metrics.calls, "signals_mock_feed_runs_total", outcome="success") == 1
