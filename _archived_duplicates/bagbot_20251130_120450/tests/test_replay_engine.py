"""Tests that ReplayEngine calls callback expected number of times and in order."""


def test_replay_engine_calls_callback():
    """Test that ReplayEngine iterates candles and calls callback for each."""
    from bagbot.backtest.replay import ReplayEngine
    
    candles = [
        {"timestamp": "1", "close": 100.0},
        {"timestamp": "2", "close": 101.0},
        {"timestamp": "3", "close": 102.0},
    ]
    
    call_count = [0]
    received = []
    
    def callback(candle):
        call_count[0] += 1
        received.append(candle["timestamp"])
    
    engine = ReplayEngine(candles, tick_callback=callback)
    engine.run()
    
    assert call_count[0] == 3
    assert received == ["1", "2", "3"]


def test_replay_engine_run_from_to():
    """Test run_from_to calls callback for subset of candles."""
    from bagbot.backtest.replay import ReplayEngine
    
    candles = [
        {"timestamp": "1", "close": 100.0},
        {"timestamp": "2", "close": 101.0},
        {"timestamp": "3", "close": 102.0},
        {"timestamp": "4", "close": 103.0},
        {"timestamp": "5", "close": 104.0},
    ]
    
    received = []
    
    def callback(candle):
        received.append(candle["timestamp"])
    
    engine = ReplayEngine(candles, tick_callback=callback)
    engine.run_from_to(1, 3)
    
    assert len(received) == 3
    assert received == ["2", "3", "4"]
