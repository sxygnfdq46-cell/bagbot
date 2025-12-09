from backend.brain.models.schemas import FusionResult
from backend.brain.utils.decision import build_decision_envelope


def test_decision_mapping_and_fields():
    fusion = FusionResult(
        fusion_score=0.4,
        direction="long",
        confidence=0.7,
        rationale=["good momentum"],
        signals_used=[],
    )
    decision = build_decision_envelope(fusion)
    assert decision.action == "buy"
    assert decision.score == 0.4
    assert decision.confidence == 0.7
    assert decision.reasons == ["good momentum"]


def test_decision_short_maps_to_sell():
    fusion = FusionResult(
        fusion_score=-0.3,
        direction="short",
        confidence=0.6,
        rationale=["mean reversion"],
        signals_used=[],
    )
    decision = build_decision_envelope(fusion)
    assert decision.action == "sell"


def test_decision_invalid_direction_defaults_neutral():
    fusion = FusionResult(
        fusion_score=0.0,
        direction="unknown",
        confidence=0.2,
        rationale=["none"],
        signals_used=[],
    )
    decision = build_decision_envelope(fusion)
    assert decision.action == "hold"
    assert decision.score == 0.0
    assert decision.confidence == 0.2
