"""Offline learning sandbox tests (dataset, replay, evaluation)."""
from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_outcome import DecisionOutcome
from backend.schemas.decision_score import DecisionScore
from learning import offline_dataset_builder
from learning.candidate_policy import ThresholdPolicy
from learning.evaluation_report import summarize
from learning.replay_engine import replay


def _decision(decision_id: str, strategy_id: str = "strat-a", symbol: str = "BTC-USD", timeframe: str = "1h"):
    return {
        "decision_id": decision_id,
        "trace_id": f"{decision_id}-trace",
        "payload": {"strategy_id": strategy_id, "symbol": symbol, "timeframe": timeframe},
    }


def _outcome(decision_id: str, status: str, pnl: float, timestamp: float):
    return DecisionOutcome(
        decision_id=decision_id,
        trace_id=f"{decision_id}-trace",
        status=status,
        pnl=pnl,
        duration_ms=25_000,
        timestamp=timestamp,
    )


def _attribution(decision_id: str, status: str = "success", pnl: float = 1.0, *, ts: float = 1.0, strategy_id: str = "strat-a", symbol: str = "BTC-USD", timeframe: str = "1h"):
    decision = _decision(decision_id, strategy_id=strategy_id, symbol=symbol, timeframe=timeframe)
    return DecisionAttribution(
        decision_id=decision_id,
        trace_id=f"{decision_id}-trace",
        decision=decision,
        outcome=_outcome(decision_id, status, pnl, ts),
        timestamp=ts,
    )


def _score(decision_id: str, strategy_id: str, symbol: str, timeframe: str, score_val: float, *, ts: float = 1.0):
    return DecisionScore(
        decision_id=decision_id,
        trace_id=f"{decision_id}-trace",
        strategy_id=strategy_id,
        score=score_val,
        components={"base": score_val},
        status="success",
        symbol=symbol,
        timeframe=timeframe,
        timestamp=ts,
    )


def test_build_dataset_filters_and_sorts():
    a1 = _attribution("d1", ts=2.0, strategy_id="strat-a", symbol="BTC-USD", timeframe="1h")
    a2 = _attribution("d2", ts=1.0, strategy_id="strat-b", symbol="BTC-USD", timeframe="1h")
    a3 = _attribution("d3", ts=3.0, strategy_id="strat-a", symbol="ETH-USD", timeframe="4h")

    s1 = _score("d1", "strat-a", "BTC-USD", "1h", 0.8, ts=2.0)
    s3 = _score("d3", "strat-a", "ETH-USD", "4h", -0.2, ts=3.0)

    dataset = offline_dataset_builder.build_dataset(
        [a1, a2, a3],
        [s1, s3],
        strategy_id="strat-a",
        symbol="BTC-USD",
        timeframe="1h",
    )

    assert len(dataset.attributions) == 1
    assert len(dataset.scores) == 1
    attrib, score = next(dataset.iter_pairs())
    assert attrib.decision_id == "d1"
    assert score.decision_id == "d1"
    assert dataset.attributions[0].timestamp <= dataset.scores[0].timestamp


def test_replay_with_threshold_policy():
    a1 = _attribution("d1", status="success", pnl=10.0, ts=1.0)
    a2 = _attribution("d2", status="fail", pnl=-5.0, ts=2.0)
    a3 = _attribution("d3", status="neutral", pnl=0.0, ts=3.0)

    s1 = _score("d1", "strat-a", "BTC-USD", "1h", 0.8, ts=1.0)
    s2 = _score("d2", "strat-a", "BTC-USD", "1h", -0.6, ts=2.0)
    s3 = _score("d3", "strat-a", "BTC-USD", "1h", 0.1, ts=3.0)

    dataset = offline_dataset_builder.build_dataset([a1, a2, a3], [s1, s2, s3])
    policy = ThresholdPolicy(threshold=0.0, name="t0")

    results = replay(dataset, policy)

    assert len(results) == 3
    assert results[0].action == "take"
    assert results[1].action == "skip"
    assert results[2].policy_name == "t0"
    assert results[0].predicted_score == 0.8
    assert results[1].actual_score == -0.6


def test_evaluation_report_metrics():
    a1 = _attribution("d1", status="success", pnl=10.0, ts=1.0)
    a2 = _attribution("d2", status="fail", pnl=-5.0, ts=2.0)
    a3 = _attribution("d3", status="neutral", pnl=0.0, ts=3.0)

    s1 = _score("d1", "strat-a", "BTC-USD", "1h", 0.8, ts=1.0)
    s2 = _score("d2", "strat-a", "BTC-USD", "1h", -0.6, ts=2.0)
    s3 = _score("d3", "strat-a", "BTC-USD", "1h", 0.1, ts=3.0)

    dataset = offline_dataset_builder.build_dataset([a1, a2, a3], [s1, s2, s3])
    policy = ThresholdPolicy(threshold=0.0, name="t0")
    results = replay(dataset, policy)

    report = summarize(results)

    assert report.total == 3
    assert report.taken == 2
    assert report.skipped == 1
    assert abs(report.coverage - (2 / 3)) < 1e-6
    assert abs(report.success_rate - 0.5) < 1e-6
    assert report.fail_rate == 0.0
    assert report.neutral_rate == 0.5
    assert abs(report.avg_predicted - 0.1) < 1e-6
    assert abs(report.avg_actual_score - 0.1) < 1e-6
    assert report.directional_accuracy == 1.0
    assert report.pnl_sum == 10.0
    assert report.pnl_avg == 5.0
