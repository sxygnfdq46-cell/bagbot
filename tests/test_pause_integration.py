"""
Integration tests for admin pause functionality with TradingMindset and Scheduler.

Tests that pause state properly blocks trading operations while allowing
position management.
"""

import os
import pytest
import asyncio
from pathlib import Path
from unittest.mock import patch, Mock

from trading.mindset import TradingMindset, ActionType
from trading.scheduler import DailyCycleScheduler
from backend.trading_state import (
    is_trading_paused,
    get_trading_state,
    STATE_FILE
)
from api.admin_routes import save_trading_state


@pytest.fixture
def cleanup_state():
    """Cleanup state file after test."""
    yield
    if STATE_FILE.exists():
        STATE_FILE.unlink()


@pytest.fixture
def mindset():
    """Create TradingMindset instance."""
    # Set environment variables for configuration
    os.environ["MAX_ORDER_USD"] = "1000"
    os.environ["DAILY_MAX_DRAWDOWN_PERCENT"] = "5.0"
    os.environ["DEFAULT_STOP_LOSS_PERCENT"] = "2.0"
    
    return TradingMindset()


@pytest.fixture
def scheduler(mindset):
    """Create DailyCycleScheduler instance."""
    return DailyCycleScheduler(
        mindset=mindset,
        order_router=None  # No actual orders
    )


class TestPauseIntegration:
    """Test pause integration with trading modules."""
    
    def test_mindset_respects_pause_in_daily_mission(self, mindset, cleanup_state):
        """Test that daily_mission respects pause state."""
        # Pause trading
        save_trading_state({
            "paused": True,
            "reason": "Integration test pause",
            "timestamp": "2025-01-01T00:00:00"
        })
        
        # Setup trading data
        account = {"equity": 10000, "balance": 10000, "starting_equity": 10000}
        open_positions = [
            {
                "symbol": "BTCUSDT",
                "side": "long",  # Must be "long" not "buy"
                "size": 0.1,
                "entry_price": 50000,
                "current_price": 48800,  # Below stop loss
                "quantity": 0.1,
                "unrealized_pnl": -120,
                "stop_loss": 49000
            }
        ]
        signals = [
            {"symbol": "ETHUSDT", "side": "buy", "confidence": 0.8}
        ]
        
        # Run daily mission
        actions = mindset.daily_mission(account, open_positions, signals)
        
        # Should only get stop-loss action, no new trades
        assert len(actions) == 1
        assert actions[0].action_type == ActionType.CLOSE_POSITION
        assert "stop" in actions[0].reason.lower()
    
    def test_mindset_respects_pause_in_pre_trade_check(self, mindset, cleanup_state):
        """Test that pre_trade_check respects pause state."""
        # Pause trading
        save_trading_state({
            "paused": True,
            "reason": "Pre-trade check test",
            "timestamp": "2025-01-01T00:00:00"
        })
        
        # Try to submit order
        order_payload = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.01,
            "price": 50000,
            "stop_loss": 49000
        }
        account = {"equity": 10000, "balance": 10000}
        
        result = mindset.pre_trade_check(order_payload, account)
        
        # Should be rejected due to pause
        assert result.approved is False
        assert "pause" in result.reason.lower()
        assert "admin" in result.reason.lower()
    
    def test_mindset_allows_trading_when_not_paused(self, mindset, cleanup_state):
        """Test that trading works normally when not paused."""
        # Ensure not paused
        save_trading_state({
            "paused": False,
            "reason": None,
            "timestamp": None
        })
        
        # Try to submit valid order
        order_payload = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.01,
            "price": 50000,
            "stop_loss": 49000
        }
        account = {"equity": 10000, "balance": 10000}
        
        result = mindset.pre_trade_check(order_payload, account)
        
        # Should be approved
        assert result.approved is True
    
    @pytest.mark.asyncio
    async def test_scheduler_includes_pause_in_report(self, scheduler, cleanup_state):
        """Test that scheduler includes pause status in daily report."""
        # Pause trading
        save_trading_state({
            "paused": True,
            "reason": "Scheduler test pause",
            "timestamp": "2025-01-01T00:00:00"
        })
        
        # Run daily cycle
        os.environ["SCHEDULER_DRY_RUN"] = "true"
        os.environ["ENABLE_REPORT_WEBHOOK"] = "false"
        
        report = await scheduler.schedule_daily_cycle()
        
        # Check report includes pause info
        assert "trading_paused" in report
        assert report["trading_paused"] is True
        assert "pause_reason" in report
        assert "test pause" in report["pause_reason"].lower()
    
    @pytest.mark.asyncio
    async def test_scheduler_normal_operation_when_not_paused(self, scheduler, cleanup_state):
        """Test scheduler operates normally when not paused."""
        # Ensure not paused
        save_trading_state({
            "paused": False,
            "reason": None,
            "timestamp": None
        })
        
        # Run daily cycle
        os.environ["SCHEDULER_DRY_RUN"] = "true"
        os.environ["ENABLE_REPORT_WEBHOOK"] = "false"
        
        report = await scheduler.schedule_daily_cycle()
        
        # Check report shows not paused
        assert "trading_paused" in report
        assert report["trading_paused"] is False
        assert report.get("pause_reason") is None
    
    def test_pause_state_default_is_false(self, cleanup_state):
        """Test that default pause state is False."""
        if STATE_FILE.exists():
            STATE_FILE.unlink()
        
        # Check pause state
        assert is_trading_paused() is False
        
        state = get_trading_state()
        assert state["paused"] is False
        assert state["reason"] is None


class TestPauseScenarios:
    """Test real-world pause scenarios."""
    
    def test_emergency_market_halt_scenario(self, mindset, cleanup_state):
        """Test emergency market halt scenario."""
        # Simulate emergency pause
        save_trading_state({
            "paused": True,
            "reason": "Emergency: Extreme market volatility",
            "timestamp": "2025-01-01T14:30:00"
        })
        
        # Existing position with profit
        account = {"equity": 11000, "balance": 10000, "starting_equity": 10000}
        open_positions = [
            {
                "symbol": "BTCUSDT",
                "side": "buy",
                "entry_price": 50000,
                "current_price": 51000,
                "quantity": 0.2,
                "unrealized_pnl": 200,
                "stop_loss": 49000
            }
        ]
        
        # New signals (should be ignored)
        signals = [
            {"symbol": "ETHUSDT", "side": "buy", "confidence": 0.9},
            {"symbol": "SOLUSDT", "side": "buy", "confidence": 0.85}
        ]
        
        # Run daily mission
        actions = mindset.daily_mission(account, open_positions, signals)
        
        # Should get no actions (position is fine, no new trades)
        assert len(actions) == 0
    
    def test_maintenance_window_scenario(self, mindset, cleanup_state):
        """Test planned maintenance window."""
        # Scheduled maintenance
        save_trading_state({
            "paused": True,
            "reason": "Scheduled maintenance: Database upgrade",
            "timestamp": "2025-01-01T02:00:00"
        })
        
        # Try to place order
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.05,
            "price": 50000,
            "stop_loss": 49000
        }
        account = {"equity": 10000, "balance": 10000}
        
        result = mindset.pre_trade_check(order, account)
        
        # Should be blocked
        assert result.approved is False
        assert "maintenance" in result.reason.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
