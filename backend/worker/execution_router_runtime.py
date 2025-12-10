"""Runtime shim for execution routing (import-safe, fake-mode deterministic).

- Lazy-imports adapter selection and adapters.
- Fake mode yields deterministic order_id and fill_price.
- Fail-safe: returns held on adapter errors/unavailability.
"""

from __future__ import annotations

import hashlib
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return os.environ.get("EXECUTION_ROUTER_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None, value: int = 1) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            # Support increment(name, value, labels) or inc(name, labels)
            if inc.__code__.co_argcount >= 3:  # type: ignore[attr-defined]
                inc(name, value, labels=labels or {})
            else:
                inc(name, labels=labels or {})
        except Exception:  # pragma: no cover - defensive
            return


def _choose_adapter(instrument: str):
    try:
        from backend.worker.adapters import execution as exec_adapters  # type: ignore
    except Exception:
        return None

    chooser = getattr(exec_adapters, "choose_adapter_for_instrument", None)
    if callable(chooser):
        try:
            return chooser(instrument)
        except Exception:
            return None
    return None


def _deterministic_fake(envelope: Dict[str, Any]) -> Dict[str, Any]:
    order = envelope.get("order") if isinstance(envelope, dict) else {}
    instr = str((order or {}).get("instrument", "unknown"))
    side = str((order or {}).get("side", "hold"))
    size = float((order or {}).get("size", 0.0)) if isinstance(order, dict) else 0.0
    ord_type = (order or {}).get("type", "market")
    price = (order or {}).get("price")

    base_str = f"{instr}:{side}:{size}:{ord_type}:{price}"
    digest = hashlib.sha1(base_str.encode()).hexdigest()
    order_id = digest[:12]

    if str(ord_type).lower() == "limit" and price is not None:
        fill_price = float(price)
    else:
        offset = int(digest[:4], 16) % 100 / 100.0  # 0.00..0.99
        fill_price = 100.0 + offset

    return {
        "status": "success",
        "order_id": order_id,
        "fill_price": fill_price,
        "reason": "fake_mode",
        "meta": {"fake": True, "instrument": instr, "side": side},
    }


def _fail_response(reason: str, outcome: str, metrics: Any) -> Dict[str, Any]:
    _inc(metrics, "execution_failures_total", {"reason": reason})
    _inc(metrics, "execution_requests_total", {"outcome": outcome})
    return {"status": "held", "order_id": None, "fill_price": None, "reason": reason, "meta": {}}


def route_execution_request(envelope: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None) -> Dict[str, Any]:
    """Route an execution request via adapter with fake-mode and fail-safe.

    Returns dict: {status, order_id, fill_price, reason, meta}
    """

    use_fake = _fake_mode_enabled(fake_mode)

    if use_fake:
        resp = _deterministic_fake(envelope or {})
        _inc(metrics_client, "execution_requests_total", {"outcome": "success"})
        _inc(metrics_client, "execution_success_total", {"reason": "fake_mode"})
        return resp

    try:
        order = (envelope or {}).get("order", {}) if isinstance(envelope, dict) else {}
        instrument = (order or {}).get("instrument", "")
        adapter = _choose_adapter(str(instrument))
        if adapter is None:
            return _fail_response("adapter-not-available", "held", metrics_client)

        sender = getattr(adapter, "send_order", None)
        if not callable(sender):
            return _fail_response("adapter-invalid", "held", metrics_client)

        result = sender(envelope or {})
        if not isinstance(result, dict):
            return _fail_response("adapter-invalid-response", "held", metrics_client)

        resp = {
            "status": "success",
            "order_id": result.get("order_id"),
            "fill_price": result.get("fill_price"),
            "reason": None,
            "meta": result.get("meta") or {},
        }
        _inc(metrics_client, "execution_requests_total", {"outcome": "success"})
        _inc(metrics_client, "execution_success_total", {"reason": "adapter"})
        return resp
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "execution_router_error",
            extra={"event": "execution_router_error", "error": str(exc)},
        )
        return _fail_response("adapter-error", "failed", metrics_client)


__all__ = ["route_execution_request"]