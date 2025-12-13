from __future__ import annotations

import hashlib
from typing import Any, Dict, List

from .schema import ProviderSignal, clamp_confidence

_FAKE_VALUES = {"1", "true", "yes", "on"}


def _fake_mode_enabled(env: Dict[str, str]) -> bool:
    return env.get("BRAIN_FAKE_MODE", "").strip().lower() in _FAKE_VALUES


def _hash_payload(payload: Dict[str, Any]) -> int:
    if not payload:
        return 0
    raw = repr(sorted(payload.items())).encode()
    return int(hashlib.sha256(raw).hexdigest(), 16)


def tradingview_provider(payload: Dict[str, Any], *, env: Dict[str, str]) -> ProviderSignal:
    fake = _fake_mode_enabled(env)
    confidence = 0.7 if fake else 0.65
    return ProviderSignal(
        provider_id="tradingview",
        action="buy",
        confidence=clamp_confidence(confidence),
        strength=0.6,
        rationale=["tv:trend_up"],
        raw=payload or {},
    )


def indicators_provider(payload: Dict[str, Any], *, env: Dict[str, str]) -> ProviderSignal:
    fake = _fake_mode_enabled(env)
    h = _hash_payload(payload)
    confidence = 0.6 if fake else 0.55 + (h % 5) * 0.01
    action = "buy" if (h % 3) == 0 else "hold"
    return ProviderSignal(
        provider_id="indicators",
        action=action,
        confidence=clamp_confidence(confidence),
        strength=0.5,
        rationale=["ind:oscillator_mix"],
        raw=payload or {},
    )


def brain_provider(payload: Dict[str, Any], *, env: Dict[str, str]) -> ProviderSignal:
    # Import inside function to keep import-safety and avoid adapter side effects when unused.
    from backend.brain import adapter

    fake = _fake_mode_enabled(env)
    decision = adapter.decide({"ws": payload or {}}, fake_mode=fake)
    rationale: List[str] = decision.get("rationale") or []
    return ProviderSignal(
        provider_id="brain",
        action=decision.get("action") or "hold",
        confidence=clamp_confidence(float(decision.get("confidence", 0.5))),
        strength=0.5,
        rationale=rationale,
        raw=payload or {},
    )


def marketdata_provider(payload: Dict[str, Any], *, env: Dict[str, str]) -> ProviderSignal:
    fake = _fake_mode_enabled(env)
    confidence = 0.5 if fake else 0.52
    return ProviderSignal(
        provider_id="marketdata",
        action="hold",
        confidence=clamp_confidence(confidence),
        strength=0.4,
        rationale=["md:neutral_depth"] if fake else ["md:low_vol"],
        raw=payload or {},
    )


PROVIDER_FUNCS = {
    "tradingview": tradingview_provider,
    "indicators": indicators_provider,
    "brain": brain_provider,
    "marketdata": marketdata_provider,
}
