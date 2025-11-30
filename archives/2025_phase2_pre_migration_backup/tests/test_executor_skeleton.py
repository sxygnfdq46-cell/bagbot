from bagbot.worker.decisions.schema import signal_buy, signal_hold
from bagbot.worker.executor.execution_router import ExecutionRouter

def test_execute_hold_returns_simulated_message():
    router = ExecutionRouter()
    sig = signal_hold(reason="no action")
    res = router.execute(symbol="BTCUSD", signal=sig)
    assert res.success is False
    assert res.message == "HOLD"

def test_execute_buy_creates_position():
    router = ExecutionRouter()
    sig = signal_buy(confidence=0.9, size=2.0)
    res = router.execute(symbol="ETHUSD", signal=sig)
    assert res.success is True
    assert res.position is not None
    assert res.position.symbol == "ETHUSD"
