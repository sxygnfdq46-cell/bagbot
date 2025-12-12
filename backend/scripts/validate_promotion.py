import json
import sys
from typing import Any, Dict


REQUIRED_TELEMETRY_KEYS = ["spans", "metrics", "trace_id"]


def _load(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise SystemExit(f"promotion validation failed: artifact not found at {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"promotion validation failed: invalid JSON ({exc})")


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"promotion validation failed: {message}")


def validate_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    meta = payload.get("meta") or {}
    router = payload.get("router_result") or {}
    ingest_meta = (meta.get("ingest") or {}) if isinstance(meta, dict) else {}
    telemetry = ingest_meta.get("telemetry") or {}

    router_trace = (router.get("meta") or {}).get("trace_id")
    meta_trace = meta.get("trace_id") if isinstance(meta, dict) else None
    ingest_trace = ingest_meta.get("trace_id") or telemetry.get("trace_id")

    _require(payload.get("status") == "success", "top-level status must be success")
    _require(router_trace, "router_result.meta.trace_id missing")
    _require(meta_trace == router_trace, "trace_id mismatch between router_result.meta and meta")

    if ingest_trace:
        _require(ingest_trace == router_trace, "trace_id mismatch between ingest and router")

    if telemetry:
        for key in REQUIRED_TELEMETRY_KEYS:
            _require(key in telemetry, f"telemetry missing {key}")
        _require(len(telemetry.get("spans") or []) > 0, "telemetry spans empty")
        _require(len(telemetry.get("metrics") or []) > 0, "telemetry metrics empty")

    summary = {
        "trace_id": router_trace,
        "has_ingest": bool(ingest_meta),
        "has_telemetry": bool(telemetry),
        "span_count": len((telemetry.get("spans") or []) if telemetry else []),
        "metric_count": len((telemetry.get("metrics") or []) if telemetry else []),
    }
    return summary


def main(path: str) -> None:
    payload = _load(path)
    summary = validate_payload(payload)
    print("promotion validation: success")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: validate_promotion.py <staging_canary.json>")
    main(sys.argv[1])
