"""
Unit tests for Trading Mindset Module

Tests defensive behaviors, risk management, and disciplined trading psychology.
"""

import os
import pytest
from unittest.mock import patch
from bagbot.trading.mindset import (
    TradingMindset,
    TradingAction,
    ActionType,
    EODAction,
    PreTradeCheckResult,
    EODReport
)


@pytest.fixture
def base_account():
    """Base account fixture."""
    return {
        "balance": 100000.0,
        "equity": 100000.0,
        "available": 100000.0
    }


@pytest.fixture
def losing_account():
    """Account after significant loss."""
    return {
        "balance": 95000.0,
        "equity": 94000.0,  # 6% drawdown
        "available": 94000.0
    }


@pytest.fixture
def sample_position():
    """Sample open position."""
    return {
        "symbol": "BTCUSDT",
        "side": "long",
        "size": 0.5,
        "entry_price": 50000.0,
        "current_price": 51000.0,
        "stop_loss": 49000.0,
        "unrealized_pnl": 500.0
    }


@pytest.fixture
def sample_signal():
    """Sample trading signal."""
    return {
        "symbol": "ETHUSDT",
        "side": "buy",
        "quantity": 2.0,
        "price": 3000.0,
        "confidence": 0.8
    }


class TestTradingMindsetInitialization:
    """Test mindset initialization and configuration."""
    
    @patch.dict(os.environ, {
        "MAX_ORDER_USD": "5000.0",
        "DAILY_MAX_DRAWDOWN_PERCENT": "3.0",
        "DEFAULT_STOP_LOSS_PERCENT": "1.5",
        "MAX_OPEN_POSITIONS": "3",
        "EOD_ACTION": "close_all"
    })
    def test_initialization_with_env_vars(self):
        """Test initialization reads environment variables correctly."""
        mindset = TradingMindset()
        
        assert mindset.max_order_usd == 5000.0
        assert mindset.daily_max_drawdown_percent == 3.0
        assert mindset.stop_loss_percent == 1.5
        assert mindset.max_open_positions == 3
        assert mindset.eod_action_on_loss == "close_all"
    
    def test_initialization_defaults(self):
        """Test initialization uses defaults when env vars not set."""
        with patch.dict(os.environ, {}, clear=True):
            mindset = TradingMindset()
            
            assert mindset.max_order_usd == 10000.0
            assert mindset.daily_max_drawdown_percent == 5.0
            assert mindset.stop_loss_percent == 2.0
            assert mindset.max_open_positions == 5
    
    def test_initial_state(self):
        """Test initial state of mindset."""
        mindset = TradingMindset()
        
        assert mindset.daily_start_equity is None
        assert mindset.daily_trades == []
        assert mindset.last_trade_was_loss is False
        assert mindset.consecutive_losses == 0
        assert mindset.trading_halted is False
        assert mindset.halt_reason == ""


class TestPreTradeCheck:
    """Test pre-trade validation logic."""
    
    @patch.dict(os.environ, {
        "MAX_ORDER_USD": "10000.0",
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "DEFAULT_STOP_LOSS_PERCENT": "2.0"
    })
    def test_valid_order_passes(self, base_account):
        """Test valid order with stop-loss passes all checks."""
        mindset = TradingMindset()
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 49000.0  # 2% stop
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is True
        assert result.reason == "All checks passed"
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "10000.0"})
    def test_missing_stop_loss_rejected(self, base_account):
        """Test order without stop-loss is rejected."""
        mindset = TradingMindset()
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0
            # No stop_loss
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "Stop-loss is required" in result.reason
        assert result.suggested_stop_loss is not None
        assert result.suggested_stop_loss < 50000.0  # Below entry for long
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "10000.0"})
    def test_order_exceeds_max_size(self, base_account):
        """Test order exceeding MAX_ORDER_USD is rejected."""
        mindset = TradingMindset()
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 1.0,  # $50,000 order
            "price": 50000.0,
            "stop_loss": 49000.0
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "exceeds MAX_ORDER_USD" in result.reason
    
    @patch.dict(os.environ, {"DAILY_MAX_DRAWDOWN_PERCENT": "5.0"})
    def test_order_rejected_after_loss(self, base_account):
        """Test order rejected in defensive mode after loss."""
        mindset = TradingMindset()
        mindset.last_trade_was_loss = True
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 49000.0
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "after a loss" in result.reason
    
    @patch.dict(os.environ, {"DAILY_MAX_DRAWDOWN_PERCENT": "5.0"})
    def test_order_rejected_near_drawdown_limit(self, base_account):
        """Test order rejected when approaching drawdown limit."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account at 4.5% drawdown (90% of 5% limit)
        account = {
            "balance": 95500.0,
            "equity": 95500.0,
            "available": 95500.0
        }
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 49000.0
        }
        
        result = mindset.pre_trade_check(order, account)
        
        assert result.approved is False
        assert "Approaching daily drawdown limit" in result.reason
    
    @patch.dict(os.environ, {})
    def test_stop_loss_too_wide_rejected(self, base_account):
        """Test order with excessively wide stop-loss is rejected."""
        mindset = TradingMindset()
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 44000.0  # 12% stop - too wide
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "too wide" in result.reason
    
    @patch.dict(os.environ, {})
    def test_stop_loss_too_tight_rejected(self, base_account):
        """Test order with excessively tight stop-loss is rejected."""
        mindset = TradingMindset()
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 49900.0  # 0.2% stop - too tight
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "too tight" in result.reason
    
    @patch.dict(os.environ, {})
    def test_trading_halted_rejects_all(self, base_account):
        """Test all orders rejected when trading is halted."""
        mindset = TradingMindset()
        mindset.trading_halted = True
        mindset.halt_reason = "Daily drawdown exceeded"
        
        order = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "amount": 0.1,
            "price": 50000.0,
            "stop_loss": 49000.0
        }
        
        result = mindset.pre_trade_check(order, base_account)
        
        assert result.approved is False
        assert "Trading halted" in result.reason


class TestDailyMission:
    """Test daily mission logic and action generation."""
    
    @patch.dict(os.environ, {"DAILY_MAX_DRAWDOWN_PERCENT": "5.0"})
    def test_flash_loss_triggers_emergency_exit(self, sample_position):
        """Test flash loss (>5% drawdown) triggers emergency exit of all positions."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after flash loss: 94k equity = 6% drawdown
        account = {
            "balance": 94000.0,
            "equity": 94000.0,
            "available": 94000.0
        }
        
        open_positions = [sample_position]
        signals = []
        
        actions = mindset.daily_mission(account, open_positions, signals)
        
        # Should halt trading
        assert mindset.trading_halted is True
        assert "drawdown" in mindset.halt_reason.lower()
        
        # Should have emergency exit action
        assert len(actions) > 0
        assert actions[0].action_type == ActionType.EMERGENCY_EXIT
        assert actions[0].symbol == "BTCUSDT"
        assert actions[0].priority == 100
        assert "drawdown breach" in actions[0].reason.lower()
    
    @patch.dict(os.environ, {})
    def test_stop_loss_hit_creates_close_action(self, base_account):
        """Test stop-loss hit generates close position action."""
        mindset = TradingMindset()
        
        # Position where current price hit stop-loss
        position = {
            "symbol": "BTCUSDT",
            "side": "long",
            "size": 0.5,
            "entry_price": 50000.0,
            "current_price": 48500.0,  # Below stop
            "stop_loss": 49000.0,
            "unrealized_pnl": -250.0
        }
        
        actions = mindset.daily_mission(base_account, [position], [])
        
        assert len(actions) > 0
        close_actions = [a for a in actions if a.action_type == ActionType.CLOSE_POSITION]
        assert len(close_actions) > 0
        assert close_actions[0].symbol == "BTCUSDT"
        assert close_actions[0].priority == 90
    
    @patch.dict(os.environ, {"MAX_OPEN_POSITIONS": "2"})
    def test_max_positions_blocks_new_trades(self, base_account, sample_position, sample_signal):
        """Test reaching max open positions prevents new trades."""
        mindset = TradingMindset()
        
        position2 = sample_position.copy()
        position2["symbol"] = "ETHUSDT"
        
        open_positions = [sample_position, position2]  # 2 positions (at limit)
        signals = [sample_signal]
        
        actions = mindset.daily_mission(base_account, open_positions, signals)
        
        # Should not have any OPEN_POSITION actions
        open_actions = [a for a in actions if a.action_type == ActionType.OPEN_POSITION]
        assert len(open_actions) == 0
    
    @patch.dict(os.environ, {})
    def test_defensive_mode_after_loss(self, base_account, sample_signal):
        """Test defensive mode prevents new positions after loss."""
        mindset = TradingMindset()
        mindset.last_trade_was_loss = True
        mindset.consecutive_losses = 2
        
        actions = mindset.daily_mission(base_account, [], [sample_signal])
        
        # Should not open new positions
        open_actions = [a for a in actions if a.action_type == ActionType.OPEN_POSITION]
        assert len(open_actions) == 0
    
    @patch.dict(os.environ, {})
    def test_signal_processing_with_auto_stop_loss(self, base_account, sample_signal):
        """Test signal processing automatically adds stop-loss."""
        mindset = TradingMindset()
        
        actions = mindset.daily_mission(base_account, [], [sample_signal])
        
        assert len(actions) > 0
        open_action = [a for a in actions if a.action_type == ActionType.OPEN_POSITION][0]
        assert open_action.symbol == "ETHUSDT"
        assert open_action.stop_loss is not None
        assert open_action.stop_loss < sample_signal["price"]  # Below entry for long
    
    @patch.dict(os.environ, {})
    def test_trading_halted_only_manages_existing(self, base_account, sample_position, sample_signal):
        """Test halted trading still manages existing positions but doesn't open new."""
        mindset = TradingMindset()
        mindset.trading_halted = True
        mindset.halt_reason = "Test halt"
        
        actions = mindset.daily_mission(base_account, [sample_position], [sample_signal])
        
        # Should not open new positions
        open_actions = [a for a in actions if a.action_type == ActionType.OPEN_POSITION]
        assert len(open_actions) == 0


class TestEODRoutine:
    """Test end of day routine and report generation."""
    
    @patch.dict(os.environ, {
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "EOD_ACTION": "close_all"
    })
    def test_eod_after_flash_loss_closes_all(self, sample_position):
        """Test EOD routine after flash loss recommends closing all positions."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after 6% loss
        account = {
            "balance": 94000.0,
            "equity": 94000.0,
            "available": 94000.0
        }
        
        open_positions = [sample_position]
        
        report = mindset.eod_routine(open_positions, account)
        
        assert report.total_pnl == -6000.0
        assert report.total_pnl_percent == -6.0
        assert report.drawdown_percent == 6.0
        assert report.recommended_action == EODAction.CLOSE_ALL
        assert report.should_stop_trading is True
        assert len(report.actions) > 0
        assert report.actions[0].action_type == ActionType.EMERGENCY_EXIT
    
    @patch.dict(os.environ, {
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "EOD_ACTION": "hedge_all"
    })
    def test_eod_loss_hedges_positions(self, sample_position):
        """Test EOD routine hedges positions after significant loss."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after 4% loss (70%+ of limit)
        account = {
            "balance": 96000.0,
            "equity": 96000.0,
            "available": 96000.0
        }
        
        open_positions = [sample_position]
        
        report = mindset.eod_routine(open_positions, account)
        
        assert report.total_pnl == -4000.0
        assert report.recommended_action == EODAction.HEDGE_ALL
        assert report.should_stop_trading is False
        
        # Should have hedge actions
        hedge_actions = [a for a in report.actions if a.action_type == ActionType.HEDGE_POSITION]
        assert len(hedge_actions) > 0
        assert hedge_actions[0].symbol == "BTCUSDT"
    
    @patch.dict(os.environ, {
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "EOD_ACTION": "tighten_stops"
    })
    def test_eod_loss_tightens_stops(self, sample_position):
        """Test EOD routine tightens stop-losses after loss."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after 4% loss
        account = {
            "balance": 96000.0,
            "equity": 96000.0,
            "available": 96000.0
        }
        
        open_positions = [sample_position]
        
        report = mindset.eod_routine(open_positions, account)
        
        assert report.recommended_action == EODAction.TIGHTEN_STOPS
        
        # Should have adjust stop-loss actions
        adjust_actions = [a for a in report.actions if a.action_type == ActionType.ADJUST_STOP_LOSS]
        assert len(adjust_actions) > 0
        
        # New stop should be higher than original (tightened)
        original_stop = sample_position["stop_loss"]
        new_stop = adjust_actions[0].stop_loss
        assert new_stop > original_stop
    
    @patch.dict(os.environ, {})
    def test_eod_profit_maintains_positions(self, sample_position):
        """Test EOD routine maintains positions after profitable day."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after profit
        account = {
            "balance": 103000.0,
            "equity": 103000.0,
            "available": 103000.0
        }
        
        open_positions = [sample_position]
        
        report = mindset.eod_routine(open_positions, account)
        
        assert report.total_pnl == 3000.0
        assert report.total_pnl_percent == 3.0
        assert report.recommended_action == EODAction.MAINTAIN
        assert report.should_stop_trading is False
        assert "profit" in report.analysis.lower()
    
    @patch.dict(os.environ, {})
    def test_eod_minor_loss_tightens_stops(self, sample_position):
        """Test EOD routine tightens stops even for minor losses."""
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Account after minor loss (1%)
        account = {
            "balance": 99000.0,
            "equity": 99000.0,
            "available": 99000.0
        }
        
        open_positions = [sample_position]
        
        report = mindset.eod_routine(open_positions, account)
        
        assert report.total_pnl == -1000.0
        assert report.recommended_action == EODAction.TIGHTEN_STOPS
        assert "Minor daily loss" in report.analysis


class TestTradeResultTracking:
    """Test trade result recording and defensive state."""
    
    def test_record_loss_activates_defensive_mode(self):
        """Test recording a loss activates defensive mode."""
        mindset = TradingMindset()
        
        mindset.record_trade_result(-500.0)
        
        assert mindset.last_trade_was_loss is True
        assert mindset.consecutive_losses == 1
    
    def test_record_consecutive_losses(self):
        """Test consecutive losses increment counter."""
        mindset = TradingMindset()
        
        mindset.record_trade_result(-500.0)
        mindset.record_trade_result(-300.0)
        mindset.record_trade_result(-200.0)
        
        assert mindset.consecutive_losses == 3
    
    def test_record_profit_resets_defensive_mode(self):
        """Test recording a profit resets defensive mode."""
        mindset = TradingMindset()
        mindset.last_trade_was_loss = True
        mindset.consecutive_losses = 3
        
        mindset.record_trade_result(1000.0)
        
        assert mindset.last_trade_was_loss is False
        assert mindset.consecutive_losses == 0


class TestStopLossCalculations:
    """Test stop-loss calculation logic."""
    
    @patch.dict(os.environ, {"DEFAULT_STOP_LOSS_PERCENT": "2.0"})
    def test_calculate_stop_loss_long(self):
        """Test stop-loss calculation for long positions."""
        mindset = TradingMindset()
        
        entry_price = 50000.0
        stop_loss = mindset._calculate_stop_loss(entry_price, "buy")
        
        # Should be 2% below entry
        expected = 50000.0 * 0.98
        assert abs(stop_loss - expected) < 0.01
    
    @patch.dict(os.environ, {"DEFAULT_STOP_LOSS_PERCENT": "2.0"})
    def test_calculate_stop_loss_short(self):
        """Test stop-loss calculation for short positions."""
        mindset = TradingMindset()
        
        entry_price = 50000.0
        stop_loss = mindset._calculate_stop_loss(entry_price, "sell")
        
        # Should be 2% above entry
        expected = 50000.0 * 1.02
        assert abs(stop_loss - expected) < 0.01
    
    @patch.dict(os.environ, {"DEFAULT_STOP_LOSS_PERCENT": "2.0"})
    def test_tighten_stop_loss_long(self):
        """Test tightening stop-loss for long position."""
        mindset = TradingMindset()
        
        position = {
            "symbol": "BTCUSDT",
            "side": "long",
            "entry_price": 50000.0,
            "current_price": 52000.0,  # Price moved up
            "stop_loss": 49000.0  # Original stop at 2%
        }
        
        new_stop = mindset._calculate_tighter_stop_loss(position)
        
        # Should tighten to 1% below current price
        expected = 52000.0 * 0.99  # 1% stop (half of 2%)
        assert new_stop is not None
        assert abs(new_stop - expected) < 0.01
        assert new_stop > position["stop_loss"]  # Moved up
    
    @patch.dict(os.environ, {"DEFAULT_STOP_LOSS_PERCENT": "2.0"})
    def test_tighten_stop_loss_short(self):
        """Test tightening stop-loss for short position."""
        mindset = TradingMindset()
        
        position = {
            "symbol": "BTCUSDT",
            "side": "short",
            "entry_price": 50000.0,
            "current_price": 48000.0,  # Price moved down
            "stop_loss": 51000.0  # Original stop at 2%
        }
        
        new_stop = mindset._calculate_tighter_stop_loss(position)
        
        # Should tighten to 1% above current price
        expected = 48000.0 * 1.01
        assert new_stop is not None
        assert abs(new_stop - expected) < 0.01
        assert new_stop < position["stop_loss"]  # Moved down


class TestIntegrationScenarios:
    """Integration tests for complete trading scenarios."""
    
    @patch.dict(os.environ, {
        "MAX_ORDER_USD": "10000.0",
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "DEFAULT_STOP_LOSS_PERCENT": "2.0",
        "EOD_ACTION": "close_all"
    })
    def test_full_flash_loss_scenario(self):
        """
        Integration test: Flash loss scenario from requirements.
        
        Scenario:
        1. Start with $100k equity
        2. Flash loss brings equity to $94k (6% drawdown)
        3. Bot should:
           - Halt all new trading
           - Emergency exit all positions
           - EOD routine recommends CLOSE_ALL
           - Record loss and enter defensive mode
        """
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Flash loss account state
        flash_account = {
            "balance": 94000.0,
            "equity": 94000.0,
            "available": 94000.0
        }
        
        open_positions = [
            {
                "symbol": "BTCUSDT",
                "side": "long",
                "size": 0.5,
                "entry_price": 50000.0,
                "current_price": 48000.0,
                "stop_loss": 49000.0,
                "unrealized_pnl": -1000.0
            }
        ]
        
        signals = [
            {
                "symbol": "ETHUSDT",
                "side": "buy",
                "quantity": 2.0,
                "price": 3000.0
            }
        ]
        
        # Step 1: Daily mission should halt trading and emergency exit
        actions = mindset.daily_mission(flash_account, open_positions, signals)
        
        assert mindset.trading_halted is True
        assert "drawdown" in mindset.halt_reason.lower()
        
        emergency_exits = [a for a in actions if a.action_type == ActionType.EMERGENCY_EXIT]
        assert len(emergency_exits) > 0
        assert emergency_exits[0].symbol == "BTCUSDT"
        
        # Step 2: Pre-trade check should reject new orders
        new_order = {
            "symbol": "ETHUSDT",
            "side": "buy",
            "amount": 2.0,
            "price": 3000.0,
            "stop_loss": 2940.0
        }
        
        check_result = mindset.pre_trade_check(new_order, flash_account)
        assert check_result.approved is False
        assert "halted" in check_result.reason.lower()
        
        # Step 3: EOD routine should recommend CLOSE_ALL
        eod_report = mindset.eod_routine(open_positions, flash_account)
        
        assert eod_report.recommended_action == EODAction.CLOSE_ALL
        assert eod_report.should_stop_trading is True
        assert eod_report.total_pnl < 0
        assert eod_report.drawdown_percent >= 5.0
        
        # Step 4: Record the loss
        mindset.record_trade_result(-6000.0)
        assert mindset.last_trade_was_loss is True
        assert mindset.consecutive_losses == 1
    
    @patch.dict(os.environ, {
        "DAILY_MAX_DRAWDOWN_PERCENT": "5.0",
        "EOD_ACTION": "hedge_all"
    })
    def test_gradual_loss_with_hedging(self):
        """
        Integration test: Gradual loss scenario with hedging strategy.
        """
        mindset = TradingMindset()
        mindset.daily_start_equity = 100000.0
        
        # Record series of small losses
        mindset.record_trade_result(-500.0)
        mindset.record_trade_result(-300.0)
        mindset.record_trade_result(-200.0)
        
        assert mindset.consecutive_losses == 3
        
        # Account after losses (4% drawdown)
        account = {
            "balance": 96000.0,
            "equity": 96000.0,
            "available": 96000.0
        }
        
        positions = [
            {
                "symbol": "BTCUSDT",
                "side": "long",
                "size": 0.5,
                "current_price": 50000.0,
                "stop_loss": 49000.0
            }
        ]
        
        # New signals should be blocked (defensive mode)
        signals = [{"symbol": "ETHUSDT", "side": "buy", "quantity": 1.0, "price": 3000.0}]
        actions = mindset.daily_mission(account, positions, signals)
        
        open_actions = [a for a in actions if a.action_type == ActionType.OPEN_POSITION]
        assert len(open_actions) == 0  # Blocked by defensive mode
        
        # EOD should recommend hedging
        eod_report = mindset.eod_routine(positions, account)
        assert eod_report.recommended_action == EODAction.HEDGE_ALL
        
        hedge_actions = [a for a in eod_report.actions if a.action_type == ActionType.HEDGE_POSITION]
        assert len(hedge_actions) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
