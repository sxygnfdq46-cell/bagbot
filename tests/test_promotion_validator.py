import json
import pytest

from backend.scripts.validate_promotion import validate_payload


def _base_payload():
    return {
        "status": "success",
        "router_result": {"meta": {"trace_id": "abc123"}},
        "meta": {
            "trace_id": "abc123",
            "ingest": {
                "trace_id": "abc123",
                "telemetry": {
                    "trace_id": "abc123",
                    "spans": [{"name": "ingest_frame", "duration_ms": 1.0}],
                    "metrics": [{"name": "signals.ingest.invocations_total", "labels": {"path": "ingest_frame", "outcome": "success"}}],
                },
            },
        },
    }


def test_validate_payload_happy_path():
    payload = _base_payload()
    summary = validate_payload(payload)
    assert summary["trace_id"] == "abc123"
    assert summary["has_telemetry"] is True
    assert summary["span_count"] == 1
    assert summary["metric_count"] == 1


def test_validate_payload_trace_mismatch_router_vs_meta():
    payload = _base_payload()
    payload["meta"]["trace_id"] = "mismatch"
    with pytest.raises(SystemExit):
        validate_payload(payload)


def test_validate_payload_missing_telemetry_spans():
    payload = _base_payload()
    payload["meta"]["ingest"]["telemetry"]["spans"] = []
    with pytest.raises(SystemExit):
        validate_payload(payload)


def test_validate_payload_missing_telemetry_metrics():
    payload = _base_payload()
    payload["meta"]["ingest"]["telemetry"]["metrics"] = []
    with pytest.raises(SystemExit):
        validate_payload(payload)


def test_validate_payload_missing_router_trace():
    payload = _base_payload()
    payload["router_result"]["meta"].pop("trace_id")
    with pytest.raises(SystemExit):
        validate_payload(payload)
