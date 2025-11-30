import random
from bagbot.worker.indicators.sma import SMA
from bagbot.worker.indicators.ema import EMA
from bagbot.worker.indicators.rsi import RSI
from bagbot.worker.indicators.macd import MACD
from bagbot.worker.indicators.atr import ATR


def test_sma_randomized():
    """Test SMA with 10 randomized trials."""
    random.seed(42)
    sma = SMA()
    
    for _ in range(10):
        length = random.randint(1, 100)
        prices = [random.uniform(1.0, 100.0) for _ in range(length)]
        window = random.randint(5, 20)
        
        try:
            result = sma.calculate(prices, window=window)
            if length < window:
                assert result is None
            else:
                # Should return either float or None, no exceptions
                assert result is None or isinstance(result, (int, float))
        except Exception as e:
            raise AssertionError(f"SMA raised exception: {e}")


def test_ema_randomized():
    """Test EMA with 10 randomized trials."""
    random.seed(42)
    ema = EMA()
    
    for _ in range(10):
        length = random.randint(1, 100)
        prices = [random.uniform(1.0, 100.0) for _ in range(length)]
        window = random.randint(5, 20)
        
        try:
            result = ema.calculate(prices, window=window)
            if length < window:
                assert result is None
            else:
                assert result is None or isinstance(result, (int, float))
        except Exception as e:
            raise AssertionError(f"EMA raised exception: {e}")


def test_rsi_randomized():
    """Test RSI with 10 randomized trials."""
    random.seed(42)
    rsi = RSI()
    
    for _ in range(10):
        length = random.randint(1, 100)
        prices = [random.uniform(1.0, 100.0) for _ in range(length)]
        period = random.randint(10, 20)
        
        try:
            result = rsi.calculate(prices, period=period)
            if length < period + 1:
                assert result is None
            else:
                assert result is None or isinstance(result, (int, float))
        except Exception as e:
            raise AssertionError(f"RSI raised exception: {e}")


def test_macd_randomized():
    """Test MACD with 10 randomized trials."""
    random.seed(42)
    macd = MACD()
    
    for _ in range(10):
        length = random.randint(1, 100)
        prices = [random.uniform(1.0, 100.0) for _ in range(length)]
        fast = 12
        slow = 26
        signal = 9
        min_required = slow + signal
        
        try:
            result = macd.calculate(prices, fast=fast, slow=slow, signal=signal)
            if length < min_required:
                assert result is None
            else:
                # Should return dict or None
                assert result is None or isinstance(result, dict)
                if isinstance(result, dict):
                    assert "macd" in result
                    assert "signal" in result
                    assert "histogram" in result
        except Exception as e:
            raise AssertionError(f"MACD raised exception: {e}")


def test_atr_randomized():
    """Test ATR with 10 randomized trials."""
    random.seed(42)
    atr = ATR()
    
    for _ in range(10):
        length = random.randint(1, 50)
        candles = []
        for i in range(length):
            low = random.uniform(1.0, 50.0)
            high = low + random.uniform(0.1, 10.0)
            close = random.uniform(low, high)
            candles.append({"high": high, "low": low, "close": close})
        
        period = random.randint(10, 20)
        
        try:
            result = atr.calculate(candles, period=period)
            if length < period + 1:
                assert result is None
            else:
                assert result is None or isinstance(result, (int, float))
        except Exception as e:
            raise AssertionError(f"ATR raised exception: {e}")
