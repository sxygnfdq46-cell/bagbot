import json

from backend.worker.runtime_pipeline import run_pipeline_canary


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))


def test_ingest_canary_writes_telemetry_artifact(tmp_path, monkeypatch):
    metrics = _StubMetrics()

    monkeypatch.setenv("SIGNALS_INGEST_ENABLED", "1")
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")

    resp = run_pipeline_canary(metrics_client=metrics, fake_mode=True)

    artifact_path = tmp_path / "telemetry_canary.json"
    artifact_path.write_text(json.dumps(resp, sort_keys=True))

    payload = json.loads(artifact_path.read_text())
    ingest_meta = (payload.get("meta") or {}).get("ingest") or {}
    telemetry = ingest_meta.get("telemetry") or {}
    router_trace = (payload.get("router_result") or {}).get("meta", {}).get("trace_id")

    assert payload.get("status") == "success"
    assert telemetry.get("trace_id")
    assert payload.get("meta", {}).get("trace_id") == telemetry.get("trace_id") == router_trace
    assert telemetry.get("spans")
    assert telemetry.get("metrics")
    assert artifact_path.exists() and artifact_path.stat().st_size > 0
