"""
End-to-End Integration Flow Tests

These tests validate complete system integration from signal generation
through risk management to order execution.
"""

import pytest
from datetime import datetime
from pathlib import Path
from worker.mindset.mindset_engine import MindsetEngine, EmotionalState
from worker.safety.circuit_breaker import CircuitBreaker
from worker.decisions.schema import Signal, signal_buy, signal_sell, signal_hold


@pytest.fixture
def integration_state_dir(tmp_path):
    """Create temporary state directory for integration tests."""
    state_dir = tmp_path / "integration_state"
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir


@pytest.fixture
def clean_circuit_breaker(tmp_path):
    """Clean circuit breaker for each test."""
    CircuitBreaker._state_file = tmp_path / "circuit_breaker.json"
    CircuitBreaker._instance = None
    breaker = CircuitBreaker()
    yield breaker
    CircuitBreaker._instance = None


@pytest.fixture
def mindset_engine(integration_state_dir):
    """Create mindset engine with clean state."""
    engine = MindsetEngine(state_dir=integration_state_dir)
    engine.reset_daily(10000.0)
    return engine


def test_signal_schema_consistency():
    """Test that signal schema is consistent across the system."""
    # Test signal factory functions
    buy_signal = signal_buy(confidence=0.85, size=0.5, reason="Strong uptrend")
    assert buy_signal.action == "BUY"
    assert buy_signal.confidence == 0.85
    assert buy_signal.size == 0.5
    assert buy_signal.reason == "Strong uptrend"
    
    sell_signal = signal_sell(confidence=0.75, size=0.3, reason="Trend reversal")
    assert sell_signal.action == "SELL"
    assert sell_signal.confidence == 0.75
    
    hold_signal = signal_hold(reason="Consolidating")
    assert hold_signal.action == "HOLD"
    assert hold_signal.confidence == 0.0  # HOLD signals have 0.0 confidence


def test_mindset_risk_integration(mindset_engine):
    """Test integration between MindsetEngine and risk multipliers."""
    # Test CALM state (normal risk)
    mindset_engine.emotional_state = EmotionalState.CALM
    assert mindset_engine.get_risk_multiplier() == 1.0
    
    # Test CONFIDENT state (increased risk)
    mindset_engine.emotional_state = EmotionalState.CONFIDENT
    assert mindset_engine.get_risk_multiplier() == 1.25
    
    # Test CAUTIOUS state (reduced risk)
    mindset_engine.emotional_state = EmotionalState.CAUTIOUS
    assert mindset_engine.get_risk_multiplier() == 0.75
    
    # Test DEFENSIVE state (half risk)
    mindset_engine.emotional_state = EmotionalState.DEFENSIVE
    assert mindset_engine.get_risk_multiplier() == 0.5
    
    # Test LOCKED state (no trading)
    mindset_engine.emotional_state = EmotionalState.LOCKED
    assert mindset_engine.get_risk_multiplier() == 0.0


def test_circuit_breaker_integration(mindset_engine, clean_circuit_breaker):
    """Test circuit breaker integration with mindset engine."""
    # Initial state - circuit breaker off, should allow trading
    assert not clean_circuit_breaker.is_active()
    can_trade, reason = mindset_engine.should_trade(
        current_equity=10000.0,
        proposed_trade={"symbol": "BTCUSDT", "side": "BUY"}
    )
    assert can_trade
    
    # Trigger circuit breaker
    clean_circuit_breaker.trigger("Test emergency", "Integration Test")
    assert clean_circuit_breaker.is_active()
    
    # Mindset engine should block trading when locked
    mindset_engine.emotional_state = EmotionalState.LOCKED
    can_trade, reason = mindset_engine.should_trade(
        current_equity=10000.0,
        proposed_trade={"symbol": "BTCUSDT", "side": "BUY"}
    )
    assert not can_trade
    assert "locked" in reason.lower() or "circuit breaker" in reason.lower()


def test_complete_signal_flow():
    """Test complete signal generation to execution flow."""
    # 1. Generate trading signal
    signal = signal_buy(
        confidence=0.85,
        size=0.5,
        reason="Strong momentum + volume confirmation",
        metadata={
            "strategy": "AI_FUSION",
            "timeframe": "15m",
            "indicators": {
                "rsi": 65,
                "macd": "bullish",
                "volume": "above_average"
            }
        }
    )
    
    # 2. Validate signal structure
    assert signal.action == "BUY"
    assert 0.0 <= signal.confidence <= 1.0
    assert signal.size > 0
    assert signal.reason is not None
    assert "strategy" in signal.metadata
    
    # 3. Signal metadata should contain execution context
    assert signal.metadata["strategy"] == "AI_FUSION"
    assert "indicators" in signal.metadata


def test_risk_rejection_flow(mindset_engine):
    """Test that risk engine properly rejects trades based on mindset."""
    # Set up daily loss limit
    mindset_engine.reset_daily(10000.0)
    mindset_engine.max_daily_loss = 2.0  # 2% max loss
    
    # Simulate large loss (3% loss - exceeds limit)
    current_equity = 9700.0  # 3% loss
    
    proposed_trade = {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "quantity": 0.5
    }
    
    can_trade, reason = mindset_engine.should_trade(current_equity, proposed_trade)
    
    # Should reject trade due to daily loss limit
    assert not can_trade
    assert "loss limit" in reason.lower() or "locked" in reason.lower()
    
    # Mindset should be LOCKED
    assert mindset_engine.emotional_state == EmotionalState.LOCKED


def test_strategy_confidence_integration(mindset_engine, integration_state_dir):
    """Test strategy confidence tracking integration."""
    # Track successful trades
    for i in range(5):
        mindset_engine.update_strategy_confidence(
            "TestStrategy",
            {"profit": 50.0, "win": True}
        )
    
    # Get strategy confidence
    confidence = mindset_engine.get_strategy_confidence("TestStrategy")
    
    assert confidence is not None
    assert confidence.strategy_name == "TestStrategy"
    assert confidence.win_rate == 100.0
    assert confidence.consecutive_wins == 5
    assert confidence.confidence_score > 0.7
    
    # Track a loss
    mindset_engine.update_strategy_confidence(
        "TestStrategy",
        {"profit": -25.0, "win": False}
    )
    
    confidence = mindset_engine.get_strategy_confidence("TestStrategy")
    assert confidence.consecutive_wins == 0
    assert confidence.consecutive_losses == 1


def test_emotional_state_progression(mindset_engine):
    """Test emotional state changes based on performance."""
    # Start calm
    mindset_engine.reset_daily(10000.0)
    assert mindset_engine.emotional_state == EmotionalState.CALM
    
    # Record winning trades
    for _ in range(3):
        mindset_engine.record_trade_outcome(
            trade={"symbol": "BTCUSDT", "side": "BUY"},
            profit=100.0,
            profit_percent=1.0
        )
    
    # After consecutive wins, might become CONFIDENT
    # (This depends on implementation - validate behavior)
    assert mindset_engine.daily_trades_count == 3
    assert mindset_engine.consecutive_losses == 0


def test_daily_reset_integration(mindset_engine):
    """Test daily reset across multiple components."""
    # Set some state
    mindset_engine.daily_trades_count = 10
    mindset_engine.consecutive_losses = 3
    mindset_engine.emotional_state = EmotionalState.CAUTIOUS
    
    # Reset for new day
    new_equity = 11000.0
    mindset_engine.reset_daily(new_equity)
    
    # Verify reset
    assert mindset_engine.daily_trades_count == 0
    assert mindset_engine.consecutive_losses == 0
    assert mindset_engine.emotional_state == EmotionalState.CALM
    assert mindset_engine.starting_equity == new_equity


def test_max_trades_per_day_limit(mindset_engine):
    """Test max trades per day enforcement."""
    mindset_engine.reset_daily(10000.0)
    mindset_engine.max_trades_per_day = 3
    
    # Execute 3 trades
    for i in range(3):
        mindset_engine.record_trade_outcome(
            trade={"symbol": "BTCUSDT", "side": "BUY"},
            profit=50.0,
            profit_percent=0.5
        )
    
    # Should have 3 trades
    assert mindset_engine.daily_trades_count == 3
    
    # 4th trade should be rejected
    proposed_trade = {"symbol": "BTCUSDT", "side": "BUY"}
    can_trade, reason = mindset_engine.should_trade(10300.0, proposed_trade)
    
    assert not can_trade
    assert "max trades" in reason.lower()


def test_revenge_trade_cooldown(mindset_engine):
    """Test revenge trade prevention."""
    mindset_engine.reset_daily(10000.0)
    mindset_engine.revenge_trade_cooldown_minutes = 30
    
    # Record a loss
    mindset_engine.record_trade_outcome(
        trade={"symbol": "BTCUSDT", "side": "BUY"},
        profit=-100.0,
        profit_percent=-1.0
    )
    
    assert mindset_engine.last_trade_was_loss
    assert mindset_engine.last_trade_time is not None
    
    # Immediate next trade should be blocked
    proposed_trade = {"symbol": "BTCUSDT", "side": "BUY"}
    can_trade, reason = mindset_engine.should_trade(9900.0, proposed_trade)
    
    # Should enforce cooldown
    assert not can_trade
    assert "cooldown" in reason.lower()


def test_cross_system_state_consistency(mindset_engine, clean_circuit_breaker, integration_state_dir):
    """Test that state is consistent across system components."""
    # Set mindset state
    mindset_engine.emotional_state = EmotionalState.DEFENSIVE
    mindset_engine.daily_trades_count = 5
    
    # Trigger circuit breaker
    clean_circuit_breaker.trigger("Integration test", "TestSystem")
    
    # Both states should persist
    assert mindset_engine.emotional_state == EmotionalState.DEFENSIVE
    assert mindset_engine.daily_trades_count == 5
    assert clean_circuit_breaker.is_active()
    
    # Get status from both
    mindset_risk = mindset_engine.get_risk_multiplier()
    breaker_status = clean_circuit_breaker.get_status()
    
    assert mindset_risk == 0.5  # DEFENSIVE state
    assert breaker_status["active"] is True
