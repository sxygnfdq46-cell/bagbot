import pytest
from bagbot.worker.indicators.sma import SMA
from bagbot.worker.indicators.ema import EMA
from bagbot.worker.indicators.rsi import RSI
from bagbot.worker.indicators.macd import MACD
from bagbot.worker.indicators.atr import ATR


def test_sma_exact_value():
    """Test SMA with known values."""
    sma = SMA()
    prices = [1.0, 2.0, 3.0, 4.0, 5.0]
    result = sma.calculate(prices, window=3)
    # (3+4+5)/3 = 12/3 = 4.0
    assert result == pytest.approx(4.0)


def test_sma_insufficient_data():
    """Test SMA returns None with insufficient data."""
    sma = SMA()
    prices = [1.0, 2.0]
    result = sma.calculate(prices, window=3)
    assert result is None


def test_ema_returns_numeric():
    """Test EMA with known values returns numeric result."""
    ema = EMA()
    prices = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    result = ema.calculate(prices, window=5)
    assert result is not None
    assert isinstance(result, (int, float))
    # EMA should be > simple average due to weighting
    assert result > 0


def test_ema_insufficient_data():
    """Test EMA returns None with insufficient data."""
    ema = EMA()
    prices = [1.0, 2.0]
    result = ema.calculate(prices, window=5)
    assert result is None


def test_rsi_all_gains():
    """Test RSI with all gains returns 100.0."""
    rsi = RSI()
    # Rising series with 15 values (period=14 requires 15 values)
    prices = [float(i) for i in range(1, 16)]
    result = rsi.calculate(prices, period=14)
    # All gains, no losses → RSI = 100.0
    assert result == pytest.approx(100.0)


def test_rsi_insufficient_data():
    """Test RSI returns None with insufficient data."""
    rsi = RSI()
    prices = [1.0, 2.0, 3.0]
    result = rsi.calculate(prices, period=14)
    assert result is None


def test_macd_returns_dict():
    """Test MACD returns dict with required keys."""
    macd = MACD()
    # Create synthetic rising series long enough for MACD
    # Need at least slow + signal = 26 + 9 = 35 values
    prices = [float(i) for i in range(1, 50)]
    result = macd.calculate(prices, fast=12, slow=26, signal=9)
    assert result is not None
    assert isinstance(result, dict)
    assert "macd" in result
    assert "signal" in result
    assert "histogram" in result
    assert isinstance(result["macd"], (int, float))
    assert isinstance(result["signal"], (int, float))
    assert isinstance(result["histogram"], (int, float))


def test_macd_insufficient_data():
    """Test MACD returns None with insufficient data."""
    macd = MACD()
    prices = [1.0, 2.0, 3.0]
    result = macd.calculate(prices, fast=12, slow=26, signal=9)
    assert result is None


def test_atr_constant_range():
    """Test ATR with constant high-low range."""
    atr = ATR()
    # Create candles where high-low = 1.0 consistently
    # Need period + 1 = 15 candles for period=14
    candles = []
    for i in range(15):
        candles.append({
            "high": float(10 + i),
            "low": float(9 + i),
            "close": float(9.5 + i)
        })
    result = atr.calculate(candles, period=14)
    # With constant high-low of 1.0 and rising prices,
    # TR should be approximately 1.0, so ATR ≈ 1.0
    assert result is not None
    assert result == pytest.approx(1.0, abs=0.1)


def test_atr_insufficient_data():
    """Test ATR returns None with insufficient data."""
    atr = ATR()
    candles = [
        {"high": 10.0, "low": 9.0, "close": 9.5},
        {"high": 11.0, "low": 10.0, "close": 10.5}
    ]
    result = atr.calculate(candles, period=14)
    assert result is None
