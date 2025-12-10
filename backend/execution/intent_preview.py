"""Intent preview layer (import-safe, no execution side effects).

- Validates decision payloads.
- Computes expected size using lightweight risk limits and snapshot context.
- Supports deterministic fake mode via INTENT_PREVIEW_FAKE_MODE.
- Never calls routers or performs execution.
"""

from __future__ import annotations

import hashlib
import os
from typing import Any, Dict, List, Optional, Tuple

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return os.environ.get("INTENT_PREVIEW_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _extract_price(snapshot: Dict[str, Any], instrument: str) -> float:
    if not isinstance(snapshot, dict):
        return 0.0
    if "price" in snapshot:
        return _safe_float(snapshot.get("price"), 0.0)
    prices = snapshot.get("prices") if isinstance(snapshot.get("prices"), dict) else {}
    return _safe_float(prices.get(instrument, prices.get(instrument.replace("-", "/"), 0.0)), 0.0)


def _risk_limits() -> Dict[str, float]:
    return {
        "max_position_usd": _safe_float(os.getenv("MAX_POSITION_USD", 50000.0), 50000.0),
        "max_order_usd": _safe_float(os.getenv("MAX_ORDER_USD", 10000.0), 10000.0),
    }


def _normalize_decision(decision: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(decision, dict):
        return {}
    return {
        "action": str(decision.get("action", "")).lower(),
        "instrument": decision.get("instrument") or decision.get("symbol"),
        "confidence": _safe_float(decision.get("confidence", decision.get("score", 0.0)), 0.0),
        "risk_pct": max(0.0, min(1.0, _safe_float(decision.get("risk_pct", 0.01), 0.01))),
        "requested_size": _safe_float(decision.get("size", decision.get("amount", 0.0)), 0.0),
        "rationale": decision.get("rationale") or decision.get("reasons") or [],
        "meta": decision.get("meta") or {},
    }


def _validate(decision: Dict[str, Any]) -> Optional[str]:
    if not decision:
        return "missing_decision"
    if decision.get("action") not in {"buy", "sell", "hold"}:
        return "invalid_action"
    if not decision.get("instrument"):
        return "missing_instrument"
    return None


def _compute_size(decision: Dict[str, Any], snapshot: Dict[str, Any]) -> Tuple[float, List[str]]:
    limits = _risk_limits()
    price = _extract_price(snapshot, decision.get("instrument", ""))
    risk_pct = decision.get("risk_pct", 0.01)
    base_value = min(limits["max_order_usd"], limits["max_position_usd"]) * risk_pct
    risk_notes: List[str] = []

    requested = max(0.0, decision.get("requested_size", 0.0))

    size = 0.0
    if price > 0:
        suggested = base_value / price if base_value > 0 else 0.0
        if requested > 0:
            size = min(requested, suggested if suggested > 0 else requested)
            if requested > size:
                risk_notes.append("capped_by_risk_limits")
        else:
            size = suggested
    else:
        size = requested
        if size == 0:
            risk_notes.append("missing_price")

    return size, risk_notes


def _fake_preview(decision: Dict[str, Any], snapshot: Dict[str, Any]) -> Dict[str, Any]:
    base = f"{decision}|{snapshot}"
    digest = hashlib.sha256(base.encode()).hexdigest()
    size = (int(digest[:6], 16) % 10000) / 100.0  # 0.00 .. 100.00
    conf = ((int(digest[6:12], 16) % 100) / 100.0)
    action_cycle = ["buy", "sell", "hold"]
    action = action_cycle[int(digest[12:14], 16) % 3]
    return {
        "action": action,
        "size": size,
        "confidence": conf,
        "rationale": ["fake_mode"],
        "risk_notes": ["fake_mode"],
        "meta": {"fake": True},
    }


def get_intent_preview(decision: Dict[str, Any], snapshot: Dict[str, Any]) -> Dict[str, Any]:
    """Return a structured intent preview without executing orders."""

    use_fake = _fake_mode_enabled(fake_mode=None)
    if use_fake:
        return _fake_preview(decision or {}, snapshot or {})

    norm = _normalize_decision(decision or {})
    error = _validate(norm)
    if error:
        return {
            "action": "hold",
            "size": 0.0,
            "confidence": 0.0,
            "rationale": [],
            "risk_notes": [],
            "reason": "invalid_decision",
            "meta": {},
        }

    size, risk_notes = _compute_size(norm, snapshot or {})
    price = _extract_price(snapshot or {}, norm.get("instrument", ""))

    rationale = norm.get("rationale")
    if isinstance(rationale, str):
        rationale = [rationale]
    rationale = rationale if isinstance(rationale, list) else []

    return {
        "action": norm["action"],
        "size": size,
        "confidence": max(0.0, min(1.0, norm.get("confidence", 0.0))),
        "rationale": rationale,
        "risk_notes": risk_notes,
        "meta": {
            "instrument": norm.get("instrument"),
            "price": price,
            "risk_pct": norm.get("risk_pct"),
            **(norm.get("meta") if isinstance(norm.get("meta"), dict) else {}),
        },
    }


__all__ = ["get_intent_preview"]
