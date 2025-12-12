"""Telemetry coverage for signals ingest helpers."""

from backend.signals.ingest import consume_signal, ingest_frame
from backend.worker.runtime_pipeline import run_pipeline_canary


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_ingest_frame_records_success_metric(monkeypatch):
    metrics = _StubMetrics()
    telemetry = {}

    resp = ingest_frame({"instrument": "BTC-USD", "timestamp": 1}, metrics_client=metrics, telemetry=telemetry)

    assert resp["status"] == "success"
    assert telemetry["trace_id"] and resp["trace_id"] == telemetry["trace_id"]
    assert telemetry["spans"] and telemetry["spans"][0]["name"] == "ingest_frame"
    assert telemetry["spans"][0]["trace_id"] == telemetry["trace_id"]
    assert telemetry["metrics"] and telemetry["metrics"][0]["name"] == "signals.ingest.invocations_total"
    assert telemetry["metrics"][0]["labels"]["trace_id"] == telemetry["trace_id"]
    assert resp["envelope"]["meta"]["trace_id"] == telemetry["trace_id"]
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="success", path="ingest_frame") == 1


def test_ingest_frame_records_error_metric(monkeypatch):
    metrics = _StubMetrics()
    telemetry = {}

    resp = ingest_frame({}, metrics_client=metrics, telemetry=telemetry)

    assert resp["status"] == "error"
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="error", path="ingest_frame") == 1
    assert telemetry["metrics"] and telemetry["metrics"][0]["labels"]["outcome"] == "error"
    assert telemetry["metrics"][0]["labels"]["trace_id"] == telemetry["trace_id"]


def test_consume_signal_records_metric(monkeypatch):
    metrics = _StubMetrics()
    telemetry = {}

    resp = consume_signal({"instrument": "ETH-USD"}, metrics_client=metrics, telemetry=telemetry)

    assert resp["status"] == "success"
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="success", path="consume_signal") == 1
    assert telemetry["trace_id"] and resp["trace_id"] == telemetry["trace_id"]
    assert telemetry["spans"] and telemetry["spans"][0]["name"] == "consume_signal"
    assert telemetry["metrics"][0]["labels"]["trace_id"] == telemetry["trace_id"]


def test_consume_signal_propagates_trace_id_into_envelope(monkeypatch):
    metrics = _StubMetrics()
    telemetry = {}

    resp = consume_signal({"instrument": "ETH-USD"}, metrics_client=metrics, telemetry=telemetry)

    assert resp["envelope"]["meta"]["trace_id"] == telemetry["trace_id"]
    assert resp["trace_id"] == telemetry["trace_id"]


def test_ingest_frame_with_telemetry_none():
    """Test that ingest_frame generates trace_id when telemetry=None."""
    metrics = _StubMetrics()

    resp = ingest_frame({"instrument": "BTC-USD", "timestamp": 1}, metrics_client=metrics, telemetry=None)

    assert resp["status"] == "success"
    assert resp["trace_id"] is not None
    assert resp["telemetry"] is not None
    assert resp["telemetry"]["trace_id"] == resp["trace_id"]
    assert resp["envelope"]["meta"]["trace_id"] == resp["trace_id"]
    assert resp["telemetry"]["spans"] and resp["telemetry"]["spans"][0]["name"] == "ingest_frame"
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="success", path="ingest_frame") == 1


def test_consume_signal_with_telemetry_none():
    """Test that consume_signal generates trace_id when telemetry=None."""
    metrics = _StubMetrics()

    resp = consume_signal({"instrument": "ETH-USD"}, metrics_client=metrics, telemetry=None)

    assert resp["status"] == "success"
    assert resp["trace_id"] is not None
    assert resp["telemetry"] is not None
    assert resp["telemetry"]["trace_id"] == resp["trace_id"]
    assert resp["envelope"]["meta"]["trace_id"] == resp["trace_id"]
    assert resp["telemetry"]["spans"] and resp["telemetry"]["spans"][0]["name"] == "consume_signal"
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="success", path="consume_signal") == 1


def test_pipeline_canary_includes_ingest_telemetry(monkeypatch):
    metrics = _StubMetrics()

    monkeypatch.setenv("SIGNALS_INGEST_ENABLED", "1")
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")

    resp = run_pipeline_canary(metrics_client=metrics, fake_mode=True)

    ingest_meta = (resp.get("meta") or {}).get("ingest") or {}
    telemetry = ingest_meta.get("telemetry") or {}
    router_trace = (resp.get("router_result") or {}).get("meta", {}).get("trace_id")

    assert resp["status"] == "success"
    assert telemetry.get("spans") and telemetry["spans"][0]["name"] == "ingest_frame"
    assert _count(metrics.calls, "signals.ingest.invocations_total", outcome="success", path="ingest_frame") >= 1
    assert resp.get("meta", {}).get("trace_id") == router_trace
    assert ingest_meta.get("trace_id") == telemetry.get("trace_id") == resp.get("meta", {}).get("trace_id")
