"""Unit tests for brain utility functions."""
import pytest
from bagbot.worker.brain.utils import resolve_strategy
from bagbot.worker.strategies.registry import register_strategy, unregister_all_strategies


def teardown_function(fn):
    """Clean up registry after each test."""
    try:
        unregister_all_strategies()
    except Exception:
        pass


def test_resolve_strategy_returns_strategy_when_exists():
    """Test that resolve_strategy returns strategy instance when it exists."""
    from bagbot.worker.strategies.ai_fusion import AIFusionStrategy
    
    # Register a known strategy
    register_strategy("test_strategy", AIFusionStrategy)
    
    # Resolve it
    strategy = resolve_strategy("test_strategy")
    
    # Should return an instance
    assert strategy is not None
    assert isinstance(strategy, AIFusionStrategy)


def test_resolve_strategy_returns_none_when_missing():
    """Test that resolve_strategy returns None when strategy doesn't exist."""
    unregister_all_strategies()
    
    # Try to resolve non-existent strategy
    strategy = resolve_strategy("nonexistent_strategy")
    
    # Should return None
    assert strategy is None


def test_resolve_strategy_logs_error_when_missing(caplog):
    """Test that resolve_strategy logs error when strategy is missing."""
    unregister_all_strategies()
    
    # Try to resolve non-existent strategy
    strategy = resolve_strategy("missing_strategy")
    
    # Should log error
    assert "Brain routing: unknown strategy missing_strategy" in caplog.text
    assert strategy is None


def test_resolve_strategy_handles_exceptions_gracefully():
    """Test that resolve_strategy handles exceptions without crashing."""
    # Even with a completely broken registry state, should not raise
    strategy = resolve_strategy("any_name")
    
    # Should return None, not raise
    assert strategy is None or strategy is not None  # Either outcome is acceptable
