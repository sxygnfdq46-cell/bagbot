from backend.brain.utils.normalizer import normalize_signal


def test_normalizer_defaults_and_clamping():
    raw = {"type": None, "strength": "not-a-number", "confidence": 2, "timestamp": "bad"}
    sig = normalize_signal(raw, provider_id=None)
    assert sig.type == "unknown"
    assert sig.provider_id == "unknown"
    assert sig.strength == 0.0
    assert sig.confidence == 1.0  # clamped
    assert sig.timestamp == 0.0
    assert sig.metadata == {}


def test_normalizer_with_values():
    raw = {
        "type": "momentum",
        "provider_id": "alpha",
        "strength": 0.7,
        "confidence": 0.6,
        "timestamp": 1700000000,
        "metadata": {"symbol": "AAPL"},
    }
    sig = normalize_signal(raw)
    assert sig.type == "momentum"
    assert sig.provider_id == "alpha"
    assert sig.strength == 0.7
    assert sig.confidence == 0.6
    assert sig.timestamp == 1700000000
    assert sig.metadata == {"symbol": "AAPL"}


def test_normalizer_does_not_mutate_input():
    raw = {"type": "news", "metadata": {"headline": "hi"}}
    sig = normalize_signal(raw)
    raw["metadata"]["headline"] = "changed"
    assert sig.metadata["headline"] == "hi"
