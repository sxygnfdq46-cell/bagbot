from __future__ import annotations

import os
from typing import Any, Dict, List, Tuple

from .providers import PROVIDER_FUNCS, _fake_mode_enabled
from .schema import OrchestratorResult, ProviderSignal, clamp_confidence


def _inc(metrics_client: Any, name: str, labels: Dict[str, Any]) -> None:
    if not metrics_client:
        return
    inc = getattr(metrics_client, "inc", None) or getattr(metrics_client, "increment", None)
    if not callable(inc):
        return
    try:
        inc(name, labels=labels)
    except Exception:
        return


def _select_best(signals: List[ProviderSignal]) -> ProviderSignal:
    # Deterministic: sort by confidence desc, then provider_id asc.
    return sorted(signals, key=lambda s: (-s.confidence, s.provider_id))[0]


def orchestrate_providers(
    payload: Dict[str, Any],
    *,
    metrics_client: Any = None,
    fake_mode: bool | None = None,
) -> Dict[str, Any]:
    env = os.environ
    use_fake = _fake_mode_enabled(env) if fake_mode is None else bool(fake_mode)

    _inc(metrics_client, "brain_orchestrator_requests_total", {})

    signals: List[ProviderSignal] = []
    failures: List[str] = []

    for provider_id, func in PROVIDER_FUNCS.items():
        try:
            sig = func(payload, env=env)
            signals.append(sig)
            _inc(metrics_client, "brain_orchestrator_provider_success_total", {"provider": provider_id})
        except Exception:
            failures.append(provider_id)
            _inc(metrics_client, "brain_orchestrator_provider_failure_total", {"provider": provider_id})

    if not signals:
        result = OrchestratorResult(
            action="hold",
            confidence=0.3,
            provider="none",
            rationale=["no_providers_available"],
            meta={"signals_used": [], "failed_providers": failures, "fake_mode": use_fake},
        )
        _inc(metrics_client, "brain_orchestrator_decisions_total", {"action": result.action})
        return {
            "action": result.action,
            "confidence": result.confidence,
            "rationale": result.rationale,
            "meta": result.meta,
        }

    best = _select_best(signals)
    confidence = clamp_confidence(best.confidence)
    rationale = best.rationale or [f"selected:{best.provider_id}"]

    result = OrchestratorResult(
        action=best.action or "hold",
        confidence=confidence,
        provider=best.provider_id,
        rationale=rationale,
        meta={
            "signals_used": [s.provider_id for s in signals],
            "failed_providers": failures,
            "fake_mode": use_fake,
        },
    )

    _inc(metrics_client, "brain_orchestrator_decisions_total", {"action": result.action})

    return {
        "action": result.action,
        "confidence": result.confidence,
        "rationale": result.rationale,
        "meta": result.meta,
    }


__all__ = ["orchestrate_providers"]
