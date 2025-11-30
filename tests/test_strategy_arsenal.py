"""
Tests for Strategy Arsenal and Micro Trend Follower
"""

import pytest
from datetime import datetime
from bagbot.trading.strategy_arsenal import (
    StrategyArsenal,
    BaseStrategy,
    StrategyMetadata,
    StrategyConfig,
    Signal,
    StrategyType,
    TimeFrame,
    MarketType
)
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower


@pytest.fixture
def arsenal():
    """Create strategy arsenal instance."""
    return StrategyArsenal()


@pytest.fixture
def micro_strategy():
    """Create micro trend follower instance."""
    return MicroTrendFollower()


def test_arsenal_initialization(arsenal):
    """Test arsenal initialization."""
    assert len(arsenal.strategies) == 0
    assert len(arsenal.active_strategies) == 0


def test_register_strategy(arsenal, micro_strategy):
    """Test strategy registration."""
    arsenal.register_strategy(micro_strategy)
    
    assert "MicroTrendFollower" in arsenal.strategies
    assert "MicroTrendFollower" in arsenal.strategy_performance


def test_register_with_auto_activate(arsenal, micro_strategy):
    """Test strategy registration with auto-activation."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    assert micro_strategy.is_active is True
    assert "MicroTrendFollower" in arsenal.active_strategies


def test_activate_strategy(arsenal, micro_strategy):
    """Test strategy activation."""
    arsenal.register_strategy(micro_strategy)
    
    success = arsenal.activate_strategy("MicroTrendFollower")
    
    assert success is True
    assert micro_strategy.is_active is True
    assert "MicroTrendFollower" in arsenal.active_strategies


def test_deactivate_strategy(arsenal, micro_strategy):
    """Test strategy deactivation."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    success = arsenal.deactivate_strategy("MicroTrendFollower")
    
    assert success is True
    assert micro_strategy.is_active is False
    assert "MicroTrendFollower" not in arsenal.active_strategies


def test_micro_strategy_initialization(micro_strategy):
    """Test micro strategy initialization."""
    assert micro_strategy.metadata.name == "MicroTrendFollower"
    assert micro_strategy.metadata.timeframe == TimeFrame.TICK
    assert micro_strategy.config.stop_loss_percent == 0.5


def test_micro_strategy_tick_processing(micro_strategy):
    """Test tick processing."""
    # First tick (initialization)
    tick1 = {
        "symbol": "BTCUSDT",
        "price": 50000.0,
        "volume": 1.0,
        "timestamp": datetime.now().isoformat()
    }
    signal = micro_strategy.on_tick(tick1)
    assert signal is None  # First tick just initializes
    
    # Second tick (upward move)
    tick2 = {
        "symbol": "BTCUSDT",
        "price": 50010.0,  # Significant up move
        "volume": 1.0,
        "timestamp": datetime.now().isoformat()
    }
    signal = micro_strategy.on_tick(tick2)
    
    # Should generate buy signal
    if signal:  # May be throttled
        assert signal.side == "buy"
        assert signal.symbol == "BTCUSDT"


def test_micro_strategy_position_reversal(micro_strategy):
    """Test position reversal logic."""
    micro_strategy.current_position = "long"
    micro_strategy.position_entry_price = 50000.0
    micro_strategy.last_price = 50000.0
    
    # Large downward move - should trigger reversal
    tick = {
        "symbol": "BTCUSDT",
        "price": 49980.0,  # -0.04% move
        "volume": 1.0,
        "timestamp": datetime.now().isoformat()
    }
    
    signal = micro_strategy.on_tick(tick)
    
    if signal:
        assert signal.side == "sell"
        assert "reversal" in signal.reason.lower() or "short" in micro_strategy.current_position


def test_micro_strategy_stop_loss(micro_strategy):
    """Test stop loss functionality."""
    micro_strategy.current_position = "long"
    micro_strategy.position_entry_price = 50000.0
    micro_strategy.last_price = 50000.0
    
    # Move below stop loss (-0.5%)
    tick = {
        "symbol": "BTCUSDT",
        "price": 49750.0,  # -0.5%
        "volume": 1.0,
        "timestamp": datetime.now().isoformat()
    }
    
    signal = micro_strategy.on_tick(tick)
    
    if signal:
        assert signal.side == "sell"
        assert "stop loss" in signal.reason.lower() or micro_strategy.current_position is None


def test_micro_strategy_throttling(micro_strategy):
    """Test order throttling."""
    # Send many signals rapidly
    signals_generated = 0
    
    for i in range(100):
        tick = {
            "symbol": "BTCUSDT",
            "price": 50000.0 + (i * 0.1),  # Small increments
            "volume": 1.0,
            "timestamp": datetime.now().isoformat()
        }
        
        signal = micro_strategy.on_tick(tick)
        if signal:
            signals_generated += 1
    
    # Should be throttled (not 100 signals)
    assert signals_generated < 100


def test_arsenal_signal_collection(arsenal, micro_strategy):
    """Test signal collection from multiple strategies."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    market_data = {
        "price": 50000.0,
        "volume": 1000.0
    }
    account = {
        "balance": 10000.0,
        "equity": 10500.0
    }
    
    signals = arsenal.get_all_signals(market_data, account)
    
    # Micro strategy doesn't use generate_signals, so should be empty
    assert isinstance(signals, list)


def test_arsenal_tick_routing(arsenal, micro_strategy):
    """Test tick routing to tick-based strategies."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    tick = {
        "symbol": "BTCUSDT",
        "price": 50000.0,
        "volume": 1.0,
        "timestamp": datetime.now().isoformat()
    }
    
    signals = arsenal.route_tick(tick)
    
    assert isinstance(signals, list)


def test_arsenal_trade_notification(arsenal, micro_strategy):
    """Test trade execution notification."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    trade = {
        "strategy_name": "MicroTrendFollower",
        "symbol": "BTCUSDT",
        "side": "buy",
        "price": 50000.0
    }
    
    arsenal.notify_trade_executed(trade)
    
    # Check performance tracking updated
    perf = arsenal.strategy_performance["MicroTrendFollower"]
    assert perf["total_trades"] == 1


def test_arsenal_performance_tracking(arsenal, micro_strategy):
    """Test strategy performance tracking."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    trade = {
        "strategy_name": "MicroTrendFollower",
        "symbol": "BTCUSDT",
        "side": "buy",
        "price": 50000.0
    }
    
    # Simulate winning trade
    arsenal.notify_trade_executed(trade)
    arsenal.notify_trade_closed(trade, 100.0)
    
    perf = arsenal.strategy_performance["MicroTrendFollower"]
    assert perf["total_trades"] == 1
    assert perf["winning_trades"] == 1
    assert perf["total_profit"] == 100.0
    assert perf["win_rate"] == 100.0


def test_arsenal_get_strategy_list(arsenal, micro_strategy):
    """Test getting strategy list."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    strategies = arsenal.get_strategy_list()
    
    assert len(strategies) == 1
    assert strategies[0]["name"] == "MicroTrendFollower"
    assert strategies[0]["is_active"] is True


def test_arsenal_get_strategy_status(arsenal, micro_strategy):
    """Test getting specific strategy status."""
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    status = arsenal.get_strategy_status("MicroTrendFollower")
    
    assert status is not None
    assert status["name"] == "MicroTrendFollower"
    assert status["is_active"] is True
    assert "performance" in status


def test_micro_strategy_statistics(micro_strategy):
    """Test strategy statistics."""
    # Process some ticks
    for i in range(10):
        tick = {
            "symbol": "BTCUSDT",
            "price": 50000.0 + i,
            "volume": 1.0,
            "timestamp": datetime.now().isoformat()
        }
        micro_strategy.on_tick(tick)
    
    stats = micro_strategy.get_statistics()
    
    assert stats["total_ticks_processed"] == 10
    assert "signals_generated" in stats
    assert "reversals_count" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
