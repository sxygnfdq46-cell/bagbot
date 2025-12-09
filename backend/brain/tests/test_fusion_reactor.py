from backend.brain.models.schemas import NormalizedSignal
from backend.brain.utils.fusion import fuse_signals, FusionConfig


def _sig(type_: str, strength: float, confidence: float, provider: str = "p1") -> NormalizedSignal:
    return NormalizedSignal(
        type=type_, provider_id=provider, strength=strength, confidence=confidence, timestamp=0.0, metadata={}
    )


def test_fusion_deterministic_with_weights():
    signals = [_sig("momentum", 1.0, 0.8), _sig("news", 0.5, 0.6, provider="p2")]
    result1 = fuse_signals(signals)
    result2 = fuse_signals(signals)
    assert result1 == result2
    assert result1.direction == "long"
    assert result1.fusion_score > 0
    assert result1.confidence <= 1.0


def test_fusion_short_direction():
    signals = [_sig("mean_reversion", -1.2, 0.9)]
    result = fuse_signals(signals)
    assert result.direction == "short"
    assert result.fusion_score < 0


def test_fusion_neutral_when_below_threshold():
    cfg = FusionConfig(weights={"momentum": 1.0}, neutral_threshold=0.2)
    signals = [_sig("momentum", 0.1, 0.5)]
    result = fuse_signals(signals, config=cfg)
    assert result.direction == "neutral"


def test_fusion_empty_list_returns_neutral():
    result = fuse_signals([])
    assert result.direction == "neutral"
    assert result.fusion_score == 0.0
    assert result.confidence == 0.0


def test_fusion_respects_custom_weights():
    cfg = FusionConfig(weights={"momentum": 2.0}, neutral_threshold=0.01)
    sig = _sig("momentum", 0.5, 1.0)
    result = fuse_signals([sig], config=cfg)
    assert result.fusion_score == 0.5 * 1.0 * 2.0 / (2.0 * 1.0)
