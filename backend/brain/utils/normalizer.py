from __future__ import annotations

from typing import Any, Dict, Optional
import copy

from backend.brain.models.schemas import NormalizedSignal


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _safe_metadata(meta: Any) -> Dict[str, Any]:
    if isinstance(meta, dict):
        return copy.deepcopy(meta)
    return {}


def normalize_signal(raw: Dict[str, Any], provider_id: Optional[str] = None) -> NormalizedSignal:
    raw = raw or {}
    signal_type = str(raw.get("type") or "unknown")
    pid = str(provider_id or raw.get("provider_id") or "unknown")
    strength = _safe_float(raw.get("strength"), 0.0)
    confidence = _safe_float(raw.get("confidence"), 0.0)
    if confidence < 0:
        confidence = 0.0
    if confidence > 1:
        confidence = 1.0
    timestamp = _safe_float(raw.get("timestamp"), 0.0)
    metadata = _safe_metadata(raw.get("metadata"))

    return NormalizedSignal(
        type=signal_type,
        provider_id=pid,
        strength=strength,
        confidence=confidence,
        timestamp=timestamp,
        metadata=metadata,
    )
