from __future__ import annotations

"""Brain integration adapter (import-safe, pure orchestrator)."""

from typing import Any, Dict, Iterable, List, Optional

from backend.brain.utils.normalizer import normalize_signal
from backend.brain.utils.fusion import fuse_signals, FusionConfig, DEFAULT_CONFIG
from backend.brain.utils.decision import build_decision_envelope

FAKE_DECISION = {
    "action": "hold",
    "confidence": 0.5,
    "rationale": ["fake_mode enabled"],
    "meta": {"source": "fake"},
}


def _iter_signals(signals: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    for _, payload in (signals or {}).items():
        if isinstance(payload, dict):
            yield payload


def _inc_metric(metrics_client: Any, action: str) -> None:
    if not metrics_client:
        return
    inc = getattr(metrics_client, "inc", None) or getattr(metrics_client, "increment", None)
    if callable(inc):
        try:
            inc("brain_decisions_total", labels={"action": action} if "labels" in inc.__code__.co_varnames else action)
        except Exception:
            return


def decide(
    signals: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None,
    *,
    metrics_client: Any = None,
    fake_mode: bool = False,
) -> Dict[str, Any]:
    """Return a deterministic decision given raw signals.

    - Pure: no network/filesystem side effects, no import-time work.
    - fake_mode yields deterministic canned output for tests/CI.
    - metrics_client is optional; if provided, increments brain_decisions_total{action=...}.
    """

    if fake_mode:
        _inc_metric(metrics_client, FAKE_DECISION["action"])
        return dict(FAKE_DECISION)

    cfg = config or {}
    fusion_cfg = FusionConfig(weights=cfg.get("weights", DEFAULT_CONFIG.weights), neutral_threshold=cfg.get("threshold", DEFAULT_CONFIG.neutral_threshold))

    normalized = [normalize_signal(raw_sig) for raw_sig in _iter_signals(signals)]
    fusion = fuse_signals(normalized, config=fusion_cfg)
    envelope = build_decision_envelope(fusion)

    result = {
        "action": envelope.action,
        "confidence": envelope.confidence,
        "rationale": envelope.reasons,
        "meta": {"signals_used": envelope.signals_used},
    }

    _inc_metric(metrics_client, result["action"])
    return result


__all__ = ["decide"]
