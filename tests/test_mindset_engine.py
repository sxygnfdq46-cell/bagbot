"""
Tests for Mindset Engine v2
"""

import pytest
from datetime import datetime, timedelta
from worker.mindset.mindset_engine import (
    MindsetEngine,
    EmotionalState,
    PerformanceGrade,
    DailyMetrics,
    StrategyConfidence
)


@pytest.fixture
def mindset():
    """Create a mindset engine instance for testing."""
    return MindsetEngine()


@pytest.fixture
def reset_mindset(mindset):
    """Reset mindset to clean state."""
    mindset.reset_daily(10000.0)
    # Clear strategy confidence file to avoid state accumulation
    if mindset.strategy_confidence_file.exists():
        mindset.strategy_confidence_file.unlink()
    return mindset


def test_initialization(mindset):
    """Test mindset engine initialization."""
    assert mindset.emotional_state == EmotionalState.CALM
    assert mindset.daily_trades_count == 0
    assert mindset.consecutive_losses == 0


def test_daily_reset(mindset):
    """Test daily reset functionality."""
    # Set some state
    mindset.daily_trades_count = 10
    mindset.consecutive_losses = 3
    mindset.emotional_state = EmotionalState.DEFENSIVE
    
    # Reset
    mindset.reset_daily(15000.0)
    
    # Check reset
    assert mindset.starting_equity == 15000.0
    assert mindset.daily_trades_count == 0
    assert mindset.consecutive_losses == 0
    assert mindset.emotional_state == EmotionalState.CALM


def test_should_trade_when_calm(reset_mindset):
    """Test trading allowed in calm state."""
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    
    can_trade, reason = reset_mindset.should_trade(10000.0, trade)
    
    assert can_trade is True
    assert "calm" in reason.lower()


def test_daily_loss_limit(reset_mindset):
    """Test daily loss limit circuit breaker."""
    # Simulate 3% loss (default limit)
    current_equity = 9700.0  # -3% from 10000
    
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    can_trade, reason = reset_mindset.should_trade(current_equity, trade)
    
    assert can_trade is False
    assert "loss limit" in reason.lower()
    assert reset_mindset.emotional_state == EmotionalState.LOCKED


def test_max_trades_per_day(reset_mindset):
    """Test max trades per day limit."""
    # Set trades to limit
    reset_mindset.daily_trades_count = reset_mindset.max_trades_per_day
    
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    can_trade, reason = reset_mindset.should_trade(10000.0, trade)
    
    assert can_trade is False
    assert "max trades" in reason.lower()


def test_revenge_trade_cooldown(reset_mindset):
    """Test revenge trade prevention."""
    # Record a loss
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    reset_mindset.record_trade_outcome(trade, -50.0, -0.5)
    
    # Immediate retry should be blocked
    can_trade, reason = reset_mindset.should_trade(9950.0, trade)
    
    assert can_trade is False
    assert "cooldown" in reason.lower()


def test_emotional_state_after_win(reset_mindset):
    """Test emotional state upgrade after win."""
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    
    # Record a big win
    reset_mindset.record_trade_outcome(trade, 250.0, 2.5)
    
    assert reset_mindset.emotional_state == EmotionalState.CONFIDENT
    assert reset_mindset.consecutive_losses == 0


def test_emotional_state_after_loss(reset_mindset):
    """Test emotional state downgrade after loss."""
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    
    # Record multiple losses
    for _ in range(3):
        reset_mindset.record_trade_outcome(trade, -50.0, -0.5)
    
    assert reset_mindset.emotional_state == EmotionalState.DEFENSIVE
    assert reset_mindset.consecutive_losses == 3


def test_risk_multiplier(reset_mindset):
    """Test risk multiplier based on emotional state."""
    # Calm state
    assert reset_mindset.get_risk_multiplier() == 1.0
    
    # Confident state
    reset_mindset.emotional_state = EmotionalState.CONFIDENT
    assert reset_mindset.get_risk_multiplier() == 1.25
    
    # Defensive state
    reset_mindset.emotional_state = EmotionalState.DEFENSIVE
    assert reset_mindset.get_risk_multiplier() == 0.5
    
    # Locked state
    reset_mindset.emotional_state = EmotionalState.LOCKED
    assert reset_mindset.get_risk_multiplier() == 0.0


def test_performance_grading(reset_mindset):
    """Test daily performance grading."""
    # Excellent performance (>2% gain)
    metrics = reset_mindset.evaluate_daily_performance(10250.0)
    assert metrics.grade == PerformanceGrade.EXCELLENT.value
    assert metrics.pnl_percent > 2.0
    
    # Good performance (0.5-2% gain)
    reset_mindset.reset_daily(10000.0)
    metrics = reset_mindset.evaluate_daily_performance(10100.0)
    assert metrics.grade == PerformanceGrade.GOOD.value
    
    # Poor performance (loss)
    reset_mindset.reset_daily(10000.0)
    metrics = reset_mindset.evaluate_daily_performance(9900.0)
    assert metrics.grade == PerformanceGrade.POOR.value


def test_strategy_confidence_tracking(reset_mindset):
    """Test strategy confidence updates."""
    trade_result = {
        "profit": 50.0,
        "win": True
    }
    
    # Record wins
    for _ in range(5):
        confidence = reset_mindset.update_strategy_confidence(
            "TestStrategy",
            trade_result
        )
    
    assert confidence.win_rate == 100.0
    assert confidence.consecutive_wins == 5
    assert confidence.confidence_score > 0.7
    
    # Record loss
    loss_result = {"profit": -25.0, "win": False}
    confidence = reset_mindset.update_strategy_confidence(
        "TestStrategy",
        loss_result
    )
    
    assert confidence.consecutive_wins == 0
    assert confidence.consecutive_losses == 1


def test_auto_daily_reset(reset_mindset):
    """Test automatic daily reset when date changes."""
    # Set old date
    reset_mindset.current_date = (datetime.now() - timedelta(days=1)).date().isoformat()
    reset_mindset.daily_trades_count = 10
    
    # Call should_trade which triggers auto-reset
    trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
    reset_mindset.should_trade(11000.0, trade)
    
    # Check reset occurred
    assert reset_mindset.current_date == datetime.now().date().isoformat()
    assert reset_mindset.daily_trades_count == 0


def test_get_strategy_confidence(reset_mindset):
    """Test retrieving strategy confidence."""
    # Non-existent strategy
    confidence = reset_mindset.get_strategy_confidence("NonExistent")
    assert confidence is None
    
    # Create confidence data
    trade_result = {"profit": 50.0, "win": True}
    reset_mindset.update_strategy_confidence("TestStrategy", trade_result)
    
    # Retrieve
    confidence = reset_mindset.get_strategy_confidence("TestStrategy")
    assert confidence is not None
    assert confidence.strategy_name == "TestStrategy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
