"""Brain integration adapter (import-safe, pure orchestrator)."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Iterable, Optional

from backend.brain.utils.decision import build_decision_envelope
from backend.brain.utils.fusion import DEFAULT_CONFIG, FusionConfig, fuse_signals
from backend.brain.utils.normalizer import normalize_signal

FAKE_DECISION = {
    "action": "hold",
    "confidence": 0.5,
    "rationale": ["fake_mode enabled"],
    "meta": {"source": "fake"},
}

_FLAG_TRUE = {"1", "true", "yes", "on"}


logger = logging.getLogger(__name__)


def _use_orchestrator(env: Optional[dict[str, str]] = None) -> bool:
    env_ref = env or os.environ
    return env_ref.get("BRAIN_USE_ORCHESTRATOR", "").strip().lower() in _FLAG_TRUE


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


def _inc_orch(metrics_client: Any, name: str, labels: Dict[str, Any]) -> None:
    if not metrics_client:
        return
    inc = getattr(metrics_client, "inc", None) or getattr(metrics_client, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels)
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

    if _use_orchestrator():
        try:
            from backend.brain.orchestrator import orchestrate_providers  # lazy import to keep import safety

            orchestrated = orchestrate_providers(
                signals or {},
                metrics_client=metrics_client,
                fake_mode=fake_mode,
            )
            _inc_metric(metrics_client, orchestrated.get("action") or "hold")
            return orchestrated
        except Exception as exc:
            _inc_orch(metrics_client, "brain_orchestrator_requests_total", {"outcome": "failure"})
            logger.warning(
                "orchestrator_fallback",
                extra={
                    "event": "orchestrator_fallback",
                    "error": str(exc),
                },
            )

    cfg = config or {}
    fusion_cfg = FusionConfig(
        weights=cfg.get("weights", DEFAULT_CONFIG.weights),
        neutral_threshold=cfg.get("threshold", DEFAULT_CONFIG.neutral_threshold),
    )

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
