from bagbot.worker.decisions.schema import Signal, signal_buy, signal_hold

def test_signal_create():
    s = signal_buy(confidence=0.5, size=10.0, reason="test")
    assert isinstance(s, Signal)
    assert s.action == "BUY"
    assert 0.0 <= s.confidence <= 1.0

def test_signal_hold():
    s = signal_hold(reason="nothing")
    assert s.action == "HOLD"
