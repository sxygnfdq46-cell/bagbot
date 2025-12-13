"""Tests for decision scoring and confidence calibration (read-only)."""
import copy

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_outcome import DecisionOutcome
from backend.services import confidence_calibrator, scoring_service


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def _decision(decision_id: str, trace_id: str, strategy_id: str = "strat-1", symbol: str = "BTC-USD", timeframe: str = "1h"):
    return {
        "decision_id": decision_id,
        "trace_id": trace_id,
        "payload": {"strategy_id": strategy_id, "symbol": symbol, "timeframe": timeframe},
    }


def _attribution(decision_id: str, trace_id: str, status: str = "success", pnl: float = 10.0, duration_ms: int = 30_000):
    decision = _decision(decision_id, trace_id)
    outcome = DecisionOutcome(
        decision_id=decision_id,
        trace_id=trace_id,
        status=status,
        pnl=pnl,
        duration_ms=duration_ms,
    )
    return DecisionAttribution(decision_id=decision_id, trace_id=trace_id, decision=decision, outcome=outcome)


def test_deterministic_scoring():
    metrics = _StubMetrics()
    attribution = _attribution("d1", "t1", status="success", pnl=20.0, duration_ms=20_000)
    original = copy.deepcopy(attribution)

    score = scoring_service.score_attribution(attribution, metrics_client=metrics)

    assert score.decision_id == "d1"
    assert score.trace_id == "t1"
    assert -1.0 <= score.score <= 1.0
    assert score.components["base"] == 1.0
    assert score.components["pnl"] > 0
    assert score.components["duration"] <= 0.2
    assert attribution == original  # no mutation
    assert _count(metrics.calls, "decision_scores_total", status="success") == 1
    assert _count(metrics.calls, "avg_decision_score", strategy_id="strat-1") == 1


def test_scoring_handles_missing_ids():
    metrics = _StubMetrics()
    bad_attr = _attribution("", "", status="success", pnl=0.0)

    score = scoring_service.score_attribution(bad_attr, metrics_client=metrics)

    assert score is None
    assert _count(metrics.calls, "decision_scores_total", status="skipped", reason="missing_ids") == 1


def test_calibration_aggregation():
    metrics = _StubMetrics()
    a1 = scoring_service.score_attribution(_attribution("d1", "t1", status="success", pnl=10.0), metrics_client=metrics)
    a2 = scoring_service.score_attribution(_attribution("d2", "t2", status="fail", pnl=-20.0), metrics_client=metrics)
    a3 = scoring_service.score_attribution(_attribution("d3", "t3", status="neutral", pnl=0.0), metrics_client=metrics)

    scores = [s for s in [a1, a2, a3] if s]
    conf = confidence_calibrator.calibrate(scores, metrics_client=metrics)

    assert len(conf) == 1
    c = conf[0]
    assert c.strategy_id == "strat-1"
    assert c.count == 3
    assert -1.0 <= c.avg_score <= 1.0
    assert c.band in {"low", "medium", "high"}
    assert _count(metrics.calls, "confidence_band_distribution", band=c.band) == 1


def test_fake_mode_parity():
    metrics = _StubMetrics()
    # Simulate a fake-mode style attribution (status success, trace preserved)
    attribution = _attribution("dfake", "tfake", status="success", pnl=5.0)

    score = scoring_service.score_attribution(attribution, metrics_client=metrics)

    assert score.trace_id == "tfake"
    assert score.status == "success"
    assert _count(metrics.calls, "decision_scores_total", status="success") == 1


def test_trace_continuity_in_scores():
    metrics = _StubMetrics()
    attribution = _attribution("dtrace", "ttrace", status="fail", pnl=-5.0)

    score = scoring_service.score_attribution(attribution, metrics_client=metrics)

    assert score.trace_id == "ttrace"
    assert score.decision_id == "dtrace"
    assert _count(metrics.calls, "decision_scores_total", status="fail") == 1

