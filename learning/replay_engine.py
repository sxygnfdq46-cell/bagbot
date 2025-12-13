"""Offline replay engine for candidate policies (read-only)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_score import DecisionScore
from learning.candidate_policy import CandidatePolicy, PolicyDecision
from learning.offline_dataset_builder import OfflineDataset


@dataclass
class ReplayResult:
    decision_id: str
    trace_id: str
    strategy_id: str
    symbol: Optional[str]
    timeframe: Optional[str]
    action: str
    predicted_score: float
    actual_score: Optional[float]
    outcome_status: str
    pnl: Optional[float]
    duration_ms: Optional[int]
    policy_name: str


def _extract_strategy(decision: dict) -> str:
    payload = decision.get("payload") or {}
    return payload.get("strategy_id") or payload.get("strategy") or "unknown"


def _extract_symbol(decision: dict) -> Optional[str]:
    payload = decision.get("payload") or {}
    return payload.get("symbol")


def _extract_timeframe(decision: dict) -> Optional[str]:
    payload = decision.get("payload") or {}
    return payload.get("timeframe") or payload.get("tf")


def replay(dataset: OfflineDataset, policy: CandidatePolicy) -> List[ReplayResult]:
    """Replay dataset through policy, producing deterministic results."""

    results: List[ReplayResult] = []
    for attrib, score in dataset.iter_pairs():
        decision = policy.predict(attrib, score)
        if decision is None:
            continue
        results.append(_make_result(attrib, score, decision, policy_name=getattr(policy, "name", "policy")))
    return results


def _make_result(
    attribution: DecisionAttribution,
    score: Optional[DecisionScore],
    decision: PolicyDecision,
    *,
    policy_name: str,
) -> ReplayResult:
    actual_score = None if score is None else score.score
    strategy_id = score.strategy_id if score else _extract_strategy(attribution.decision or {})
    symbol = score.symbol if score else _extract_symbol(attribution.decision or {})
    timeframe = score.timeframe if score else _extract_timeframe(attribution.decision or {})
    predicted = max(-1.0, min(1.0, decision.predicted_score))

    return ReplayResult(
        decision_id=attribution.decision_id,
        trace_id=attribution.trace_id,
        strategy_id=strategy_id,
        symbol=symbol,
        timeframe=timeframe,
        action=decision.action,
        predicted_score=predicted,
        actual_score=actual_score,
        outcome_status=attribution.outcome.status,
        pnl=attribution.outcome.pnl,
        duration_ms=attribution.outcome.duration_ms,
        policy_name=policy_name,
    )


__all__ = ["ReplayResult", "replay"]
