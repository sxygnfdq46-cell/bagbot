"""Evaluation reporting for offline policy replay."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Iterable, List, Optional

from learning.replay_engine import ReplayResult


@dataclass
class EvaluationReport:
    policy_name: str
    total: int
    taken: int
    skipped: int
    coverage: float
    success_rate: float
    fail_rate: float
    neutral_rate: float
    avg_predicted: float
    avg_actual_score: Optional[float]
    directional_accuracy: float
    pnl_sum: float
    pnl_avg: float

    def to_dict(self) -> dict:  # pragma: no cover - convenience
        return asdict(self)


def _sign(val: Optional[float]) -> int:
    if val is None:
        return 0
    if val > 0:
        return 1
    if val < 0:
        return -1
    return 0


def summarize(results: Iterable[ReplayResult]) -> EvaluationReport:
    rows: List[ReplayResult] = list(results)
    if not rows:
        return EvaluationReport(
            policy_name="policy",
            total=0,
            taken=0,
            skipped=0,
            coverage=0.0,
            success_rate=0.0,
            fail_rate=0.0,
            neutral_rate=0.0,
            avg_predicted=0.0,
            avg_actual_score=None,
            directional_accuracy=0.0,
            pnl_sum=0.0,
            pnl_avg=0.0,
        )

    policy_name = rows[0].policy_name
    total = len(rows)
    taken_rows = [r for r in rows if r.action != "skip"]
    taken = len(taken_rows)
    skipped = total - taken
    coverage = taken / total if total else 0.0

    successes = sum(1 for r in taken_rows if r.outcome_status == "success")
    fails = sum(1 for r in taken_rows if r.outcome_status == "fail")
    neutral = taken - successes - fails
    success_rate = successes / taken if taken else 0.0
    fail_rate = fails / taken if taken else 0.0
    neutral_rate = neutral / taken if taken else 0.0

    avg_predicted = sum(r.predicted_score for r in rows) / total

    actual_scores = [r.actual_score for r in rows if r.actual_score is not None]
    avg_actual = sum(actual_scores) / len(actual_scores) if actual_scores else None

    direction_denominator = 0
    direction_hits = 0
    for r in rows:
        s_actual = _sign(r.actual_score)
        if s_actual == 0:
            continue
        direction_denominator += 1
        if _sign(r.predicted_score) == s_actual:
            direction_hits += 1
    directional_accuracy = direction_hits / direction_denominator if direction_denominator else 0.0

    pnls = [r.pnl for r in taken_rows if r.pnl is not None]
    pnl_sum = sum(pnls) if pnls else 0.0
    pnl_avg = pnl_sum / len(pnls) if pnls else 0.0

    return EvaluationReport(
        policy_name=policy_name,
        total=total,
        taken=taken,
        skipped=skipped,
        coverage=coverage,
        success_rate=success_rate,
        fail_rate=fail_rate,
        neutral_rate=neutral_rate,
        avg_predicted=avg_predicted,
        avg_actual_score=avg_actual,
        directional_accuracy=directional_accuracy,
        pnl_sum=pnl_sum,
        pnl_avg=pnl_avg,
    )


__all__ = ["EvaluationReport", "summarize"]
