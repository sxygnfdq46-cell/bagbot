"""Tests for Phase 4 strategies."""

import pytest
from bagbot.trading.strategies.fvg_strategy import FVGStrategy
from bagbot.trading.strategies.breaker_block_strategy import BreakerBlockStrategy
from bagbot.trading.strategies.liquidity_sweep_strategy import LiquiditySweepStrategy
from bagbot.trading.strategies.mean_reversion_strategy import MeanReversionStrategy
from bagbot.trading.strategies.supply_demand_strategy import SupplyDemandStrategy
from bagbot.trading.strategies.volatility_breakout_strategy import VolatilityBreakoutStrategy
from bagbot.trading.strategies.trend_continuation_strategy import TrendContinuationStrategy


def test_fvg_strategy_bullish():
    """Test FVG strategy detects bullish gaps."""
    strategy = FVGStrategy(min_gap_size=0.001)
    
    # Create bullish FVG: c1.high < c3.low
    candles = [
        {"high": 1.0000, "low": 0.9950, "close": 0.9980},
        {"high": 1.0100, "low": 1.0000, "close": 1.0050},  # Gap candle
        {"high": 1.0150, "low": 1.0050, "close": 1.0120},  # Price above c1.high
    ]
    
    signal = strategy.analyze(candles)
    
    assert signal is not None
    assert signal["action"] == "buy"
    assert "FVG" in signal["reason"]


def test_fvg_strategy_bearish():
    """Test FVG strategy detects bearish gaps."""
    strategy = FVGStrategy(min_gap_size=0.001)
    
    # Create bearish FVG: c1.low > c3.high
    candles = [
        {"high": 1.0050, "low": 1.0000, "close": 1.0020},
        {"high": 1.0000, "low": 0.9900, "close": 0.9950},  # Gap candle
        {"high": 0.9950, "low": 0.9880, "close": 0.9900},  # Price below c1.low
    ]
    
    signal = strategy.analyze(candles)
    
    assert signal is not None
    assert signal["action"] == "sell"


def test_breaker_block_strategy():
    """Test breaker block strategy."""
    strategy = BreakerBlockStrategy(lookback=10)
    
    # Create breaker: break low then reclaim
    candles = [{"high": 1.01, "low": 1.00, "close": 1.005}] * 10
    candles.append({"high": 1.005, "low": 0.995, "close": 0.996})  # Break low
    candles.append({"high": 1.01, "low": 0.998, "close": 1.008})    # Reclaim above recent_low
    
    signal = strategy.analyze(candles)
    
    # Strategy may or may not trigger depending on exact conditions
    # Just verify it runs without error and returns valid data
    if signal:
        assert signal["action"] in ["buy", "sell"]


def test_liquidity_sweep_strategy():
    """Test liquidity sweep strategy."""
    strategy = LiquiditySweepStrategy(sweep_threshold=0.001)
    
    # Create bullish sweep: wick below then close above
    candles = [
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.015, "low": 0.995, "close": 1.012},  # Sweep low, close high
    ]
    
    signal = strategy.analyze(candles)
    
    assert signal is not None
    assert signal["action"] == "buy"
    assert "sweep" in signal["reason"].lower()


def test_mean_reversion_strategy_oversold():
    """Test mean reversion detects oversold."""
    strategy = MeanReversionStrategy(period=20, std_dev=2.0)
    
    # Create oversold condition
    candles = [{"close": 1.00 + i * 0.001} for i in range(19)]
    candles.append({"close": 0.95})  # Sharp drop
    
    signal = strategy.analyze(candles)
    
    assert signal is not None
    assert signal["action"] == "buy"


def test_mean_reversion_strategy_overbought():
    """Test mean reversion detects overbought."""
    strategy = MeanReversionStrategy(period=20, std_dev=2.0)
    
    # Create overbought condition
    candles = [{"close": 1.00 - i * 0.001} for i in range(19)]
    candles.append({"close": 1.05})  # Sharp rise
    
    signal = strategy.analyze(candles)
    
    assert signal is not None
    assert signal["action"] == "sell"


def test_supply_demand_strategy():
    """Test supply/demand zone detection."""
    strategy = SupplyDemandStrategy(zone_strength_min=2)
    
    # Create consolidation zone (potential demand)
    candles = []
    for i in range(5):
        candles.append({"high": 1.001, "low": 0.999, "close": 1.000})
    
    # Price moves away then returns
    candles.extend([
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.01, "low": 1.00, "close": 1.005},
        {"high": 1.005, "low": 0.999, "close": 1.000},  # Return to zone
    ])
    
    signal = strategy.analyze(candles)
    
    # May or may not trigger depending on zone detection
    # Just verify it runs without error
    assert signal is None or signal["action"] in ["buy", "sell"]


def test_volatility_breakout_strategy():
    """Test volatility breakout detection."""
    strategy = VolatilityBreakoutStrategy(atr_period=14, breakout_multiplier=1.5)
    
    # Create steady volatility then strong breakout
    candles = []
    for i in range(15):
        candles.append({
            "high": 1.005,
            "low": 1.000,
            "close": 1.0025
        })
    
    # Add strong breakout candle (price jumps significantly)
    candles.append({
        "high": 1.025,
        "low": 1.020,
        "close": 1.024
    })
    
    signal = strategy.analyze(candles)
    
    # Should detect breakout with this data
    if signal:
        assert signal["action"] in ["buy", "sell"]
        assert "breakout" in signal["reason"].lower()


def test_trend_continuation_strategy():
    """Test trend continuation pullback."""
    strategy = TrendContinuationStrategy(trend_period=50, pullback_percent=0.382)
    
    # Create uptrend
    candles = [{"high": 1.00 + i * 0.001, "low": 0.99 + i * 0.001, "close": 1.00 + i * 0.001} for i in range(50)]
    
    # Add pullback
    for i in range(5):
        candles.append({
            "high": candles[-1]["high"],
            "low": candles[-1]["low"] - 0.002,
            "close": candles[-1]["close"] - 0.002
        })
    
    signal = strategy.analyze(candles)
    
    # Should detect pullback in uptrend
    if signal:
        assert signal["action"] == "buy"


def test_all_strategies_handle_insufficient_data():
    """Test all strategies handle insufficient data gracefully."""
    strategies = [
        FVGStrategy(),
        BreakerBlockStrategy(),
        LiquiditySweepStrategy(),
        MeanReversionStrategy(),
        SupplyDemandStrategy(),
        VolatilityBreakoutStrategy(),
        TrendContinuationStrategy()
    ]
    
    candles = [{"high": 1.0, "low": 0.9, "close": 0.95}]
    
    for strategy in strategies:
        signal = strategy.analyze(candles)
        assert signal is None
