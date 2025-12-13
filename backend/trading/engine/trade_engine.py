"""Import-safe trade engine that validates decisions, applies risk, and builds action envelopes.

No runtime wiring here; router integration is an injected dependency and safe-mode fallback is built in.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, Optional

logger = logging.getLogger(__name__)

SUPPORTED_INSTRUMENTS = {"BTC-USD", "ETH-USD"}
ALLOWED_ACTIONS = {"buy", "sell", "hold"}

DEFAULT_CONFIG = {
    "max_exposure": 100_000.0,  # notional limit
    "max_position_size": 10.0,  # units
    "risk_score_threshold": 0.7,
    "risk_scale_factor": 0.5,
    "prices": {},  # optional instrument -> price mapping
}


@dataclass
class DecisionContext:
    instrument: str
    action: str
    amount: float
    confidence: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    risk_score: float = 0.0


class TradeEngine:
    def __init__(self, *, router: Any = None, metrics: Any = None, config: Optional[Dict[str, Any]] = None):
        self.router = router
        self.metrics = metrics
        self.config = {**DEFAULT_CONFIG, **(config or {})}

    def process(
        self,
        decision: Dict[str, Any],
        *,
        fake_mode: bool = False,
        user_state: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Validate decision, apply risk, build envelope, and optionally dispatch to router."""

        start_ts = time.time()

        if fake_mode:
            envelope = self._fake_envelope(decision)
            self._inc("engine_decisions_total", {"action": envelope["action"]})
            self._observe_latency(start_ts)
            return envelope

        ctx, validation_reason = self._validate(decision, user_state=user_state)
        if not ctx:
            envelope = self._hold_envelope(reason=validation_reason or "invalid_decision", decision=decision)
            self._inc("engine_failures_total", {"reason": envelope["reason"]})
            self._inc("engine_decisions_total", {"action": envelope["action"]})
            self._observe_latency(start_ts)
            return envelope

        envelope = self._apply_risk(ctx, user_state=user_state)

        dispatched_envelope = self._dispatch(envelope)

        self._inc("engine_decisions_total", {"action": dispatched_envelope["action"]})
        self._observe_latency(start_ts)
        return dispatched_envelope

    def _validate(self, decision: Dict[str, Any], *, user_state: Optional[Dict[str, Any]]) -> tuple[Optional[DecisionContext], Optional[str]]:
        if not isinstance(decision, dict):
            return None, "invalid_type"

        instrument = (decision.get("instrument") or "").strip()
        action = (decision.get("action") or "").strip().lower()
        confidence = float(decision.get("confidence") or 0.0)
        amount = float(decision.get("amount") or 0.0)
        risk_score = float(decision.get("risk_score") or 0.0)
        metadata = decision.get("metadata") or {}

        if not instrument or instrument not in self.config.get("supported_instruments", SUPPORTED_INSTRUMENTS):
            return None, "unsupported_instrument"
        if action not in ALLOWED_ACTIONS:
            return None, "unsupported_action"
        if user_state and user_state.get("blocked"):
            return None, "blocked_state"

        return DecisionContext(
            instrument=instrument,
            action=action,
            amount=amount,
            confidence=confidence,
            metadata=metadata,
            risk_score=risk_score,
        ), None

    def _apply_risk(self, ctx: DecisionContext, user_state: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        risk_flags: list[str] = []
        reason = ""

        prices = self.config.get("prices", {})
        price = float(prices.get(ctx.instrument, 1.0))
        current_exposure = float((user_state or {}).get("current_exposure", 0.0))
        max_exposure = float(self.config.get("max_exposure", DEFAULT_CONFIG["max_exposure"]))
        max_position = float(self.config.get("max_position_size", DEFAULT_CONFIG["max_position_size"]))

        notional = abs(ctx.amount * price)

        if user_state and user_state.get("cooldown_active"):
            return self._hold_envelope(reason="cooldown_active", decision=ctx.__dict__, risk_flags=["cooldown"])

        if notional + current_exposure > max_exposure:
            return self._hold_envelope(reason="exposure_limit", decision=ctx.__dict__, risk_flags=["exposure"])

        if abs(ctx.amount) > max_position:
            return self._hold_envelope(reason="max_position", decision=ctx.__dict__, risk_flags=["max_position"])

        if ctx.risk_score > float(self.config.get("risk_score_threshold", DEFAULT_CONFIG["risk_score_threshold"])):
            scale = float(self.config.get("risk_scale_factor", DEFAULT_CONFIG["risk_scale_factor"]))
            ctx.amount = ctx.amount * scale
            risk_flags.append("scaled_for_risk")

        envelope = self._build_envelope(
            action=ctx.action,
            amount=ctx.amount,
            confidence=ctx.confidence,
            instrument=ctx.instrument,
            metadata=ctx.metadata,
            reason=reason or "accepted",
            risk_flags=risk_flags,
        )
        return envelope

    def _dispatch(self, envelope: Dict[str, Any]) -> Dict[str, Any]:
        if not self.router:
            envelope["router_status"] = "skipped"
            return envelope

        try:
            self.router.send(envelope)
            envelope["router_status"] = "sent"
            return envelope
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("router_failure", extra={"event": "router_failure", "error": str(exc)})
            self._inc("engine_failures_total", {"reason": "router_error"})
            return self._hold_envelope(reason="router_error", decision=envelope, risk_flags=["router_failover"])

    def _build_envelope(
        self,
        *,
        action: str,
        amount: float,
        confidence: float,
        instrument: str,
        metadata: Dict[str, Any],
        reason: str,
        risk_flags: Iterable[str],
    ) -> Dict[str, Any]:
        return {
            "action": action,
            "amount": amount,
            "confidence": confidence,
            "instrument": instrument,
            "metadata": {**metadata, "risk_flags": list(risk_flags)},
            "reason": reason,
        }

    def _hold_envelope(
        self,
        *,
        reason: str,
        decision: Optional[Dict[str, Any]],
        risk_flags: Optional[Iterable[str]] = None,
    ) -> Dict[str, Any]:
        decision_meta = decision or {}
        return {
            "action": "hold",
            "amount": 0.0,
            "confidence": float(decision_meta.get("confidence", 0.0)) if isinstance(decision_meta, dict) else 0.0,
            "instrument": decision_meta.get("instrument", "unknown") if isinstance(decision_meta, dict) else "unknown",
            "metadata": {"risk_flags": list(risk_flags or [])},
            "reason": reason,
        }

    def _fake_envelope(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "action": "hold",
            "amount": 0.0,
            "confidence": 0.0,
            "instrument": decision.get("instrument", "unknown") if isinstance(decision, dict) else "unknown",
            "metadata": {"risk_flags": ["fake_mode"], "fake": True},
            "reason": "fake_mode",
        }

    def _inc(self, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
        if not self.metrics:
            return
        inc = getattr(self.metrics, "inc", None) or getattr(self.metrics, "increment", None)
        if callable(inc):
            try:
                inc(name, labels=labels or {})
            except Exception:  # pragma: no cover - defensive
                return

    def _observe_latency(self, start_ts: float) -> None:
        if not self.metrics:
            return
        duration_ms = max(0.0, (time.time() - start_ts) * 1000.0)
        observe = getattr(self.metrics, "observe", None) or getattr(self.metrics, "timing", None)
        if callable(observe):
            try:
                observe("engine_decision_latency_ms", duration_ms, labels={})
            except Exception:  # pragma: no cover
                return


__all__ = ["TradeEngine"]
