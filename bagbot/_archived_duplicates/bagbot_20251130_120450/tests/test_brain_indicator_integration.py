from bagbot.worker.queue import JobQueue
from bagbot.worker.brain.brain import TradingBrain
from bagbot.worker.brain.strategy_router import StrategyRouter


def test_brain_get_indicator_value_valid():
    """Test Brain.get_indicator_value with valid data."""
    queue = JobQueue()
    router = StrategyRouter()
    brain = TradingBrain(router)
    
    # Valid SMA calculation
    prices = [1.0, 2.0, 3.0, 4.0, 5.0]
    result = brain.get_indicator_value("SMA", prices)
    
    # Should return a numeric value or None (never raise)
    assert result is None or isinstance(result, (int, float))


def test_brain_get_indicator_value_insufficient_data():
    """Test Brain.get_indicator_value with insufficient data."""
    queue = JobQueue()
    router = StrategyRouter()
    brain = TradingBrain(router)
    
    # Insufficient data for SMA
    prices = [1.0, 2.0]
    result = brain.get_indicator_value("SMA", prices)
    
    # Should return None (never raise)
    assert result is None


def test_brain_get_indicator_value_unknown_indicator():
    """Test Brain.get_indicator_value with unknown indicator name."""
    queue = JobQueue()
    router = StrategyRouter()
    brain = TradingBrain(router)
    
    prices = [1.0, 2.0, 3.0, 4.0, 5.0]
    result = brain.get_indicator_value("UNKNOWN", prices)
    
    # Should return None for unknown indicator
    assert result is None


def test_brain_get_indicator_value_never_raises():
    """Test Brain.get_indicator_value never raises exceptions."""
    queue = JobQueue()
    router = StrategyRouter()
    brain = TradingBrain(router)
    
    test_cases = [
        ("SMA", [1.0, 2.0, 3.0, 4.0, 5.0]),
        ("EMA", [1.0, 2.0, 3.0, 4.0, 5.0]),
        ("RSI", [float(i) for i in range(1, 20)]),
        ("MACD", [float(i) for i in range(1, 50)]),
        ("ATR", [{"high": 10.0, "low": 9.0, "close": 9.5} for _ in range(20)]),
        ("UNKNOWN", [1.0, 2.0, 3.0]),
        ("SMA", None),  # Invalid data type
        ("SMA", "invalid"),  # Invalid data type
        ("SMA", []),  # Empty list
    ]
    
    for indicator_name, data in test_cases:
        try:
            result = brain.get_indicator_value(indicator_name, data)
            # Should always complete without raising
            assert result is None or isinstance(result, (int, float, dict))
        except Exception as e:
            raise AssertionError(f"get_indicator_value raised exception for {indicator_name}: {e}")


def test_brain_indicator_engine_initialization():
    """Test that Brain initializes indicator engine safely."""
    queue = JobQueue()
    router = StrategyRouter()
    brain = TradingBrain(router)
    
    # Should have indicators attribute (or None if failed to initialize)
    assert hasattr(brain, "indicators")
    assert brain.indicators is None or hasattr(brain.indicators, "get")
