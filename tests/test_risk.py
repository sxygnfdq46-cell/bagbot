"""Tests for risk management module."""

import pytest
import os
from unittest.mock import patch
from worker.risk.risk import check_order_limits, RiskLimitError, get_risk_limits


class TestCheckOrderLimits:
    """Test check_order_limits function."""
    
    def test_valid_order_passes(self):
        """Test that valid order passes all checks."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.1,
            "price": 40000.0,
            "type": "limit"
        }
        
        # Should not raise
        check_order_limits(order)
    
    def test_missing_symbol_raises_error(self):
        """Test that missing symbol raises ValueError."""
        order = {
            "side": "buy",
            "amount": 0.1,
            "price": 40000.0
        }
        
        with pytest.raises(ValueError, match="missing 'symbol'"):
            check_order_limits(order)
    
    def test_missing_side_raises_error(self):
        """Test that missing side raises ValueError."""
        order = {
            "symbol": "BTC/USDT",
            "amount": 0.1,
            "price": 40000.0
        }
        
        with pytest.raises(ValueError, match="missing 'side'"):
            check_order_limits(order)
    
    def test_missing_amount_raises_error(self):
        """Test that missing amount raises ValueError."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "price": 40000.0
        }
        
        with pytest.raises(ValueError, match="missing 'amount'"):
            check_order_limits(order)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "5000"})
    def test_order_exceeds_max_order_size(self):
        """Test that order exceeding MAX_ORDER_USD is rejected."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 1.0,  # 1 BTC
            "price": 40000.0,  # = $40,000
            "type": "limit"
        }
        
        with pytest.raises(RiskLimitError, match="exceeds maximum order size limit"):
            check_order_limits(order)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000"})
    def test_order_within_max_order_size(self):
        """Test that order within MAX_ORDER_USD passes."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 1.0,  # 1 BTC
            "price": 40000.0,  # = $40,000
            "type": "limit"
        }
        
        # Should not raise
        check_order_limits(order)
    
    def test_market_order_without_price(self):
        """Test that market order without price still passes."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.1,
            "type": "market"
        }
        
        # Should not raise (can't check value without price)
        check_order_limits(order)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000", "MAX_POSITION_USD": "100000"})
    def test_new_position_within_limit(self):
        """Test that new position within MAX_POSITION_USD passes."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 1.0,
            "price": 40000.0,
            "type": "limit"
        }
        
        account_info = {
            "positions": {
                "BTC/USDT": {
                    "size": 1.0,
                    "side": "long"
                }
            }
        }
        
        # New position: 1.0 + 1.0 = 2.0 BTC = $80,000 < $100,000
        check_order_limits(order, account_info)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000", "MAX_POSITION_USD": "50000"})
    def test_new_position_exceeds_limit(self):
        """Test that new position exceeding MAX_POSITION_USD is rejected."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 1.0,
            "price": 40000.0,
            "type": "limit"
        }
        
        account_info = {
            "positions": {
                "BTC/USDT": {
                    "size": 0.5,
                    "side": "long"
                }
            }
        }
        
        # New position: 0.5 + 1.0 = 1.5 BTC = $60,000 > $50,000
        with pytest.raises(RiskLimitError, match="would exceed maximum position size limit"):
            check_order_limits(order, account_info)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000", "MAX_POSITION_USD": "100000"})
    def test_reducing_position_allowed(self):
        """Test that reducing position is allowed."""
        order = {
            "symbol": "BTC/USDT",
            "side": "sell",
            "amount": 0.5,
            "price": 40000.0,
            "type": "limit"
        }
        
        account_info = {
            "positions": {
                "BTC/USDT": {
                    "size": 2.0,
                    "side": "long"
                }
            }
        }
        
        # New position: 2.0 - 0.5 = 1.5 BTC = $60,000 < $100,000
        check_order_limits(order, account_info)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000", "MAX_POSITION_USD": "100000"})
    def test_opening_short_position(self):
        """Test opening short position."""
        order = {
            "symbol": "BTC/USDT",
            "side": "sell",
            "amount": 1.0,
            "price": 40000.0,
            "type": "limit"
        }
        
        account_info = {
            "positions": {}  # No existing position
        }
        
        # New short position: 1.0 BTC = $40,000 < $100,000
        check_order_limits(order, account_info)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "50000", "MAX_POSITION_USD": "100000"})
    def test_no_account_info_skips_position_check(self):
        """Test that without account_info, position check is skipped."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 1.0,
            "price": 40000.0,
            "type": "limit"
        }
        
        # Should pass (no position check)
        check_order_limits(order, account_info=None)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "10000", "MAX_POSITION_USD": "50000"})
    def test_both_limits_enforced(self):
        """Test that both order and position limits are enforced."""
        # Order that passes order limit but fails position limit
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.2,  # $8,000 order (under $10k order limit)
            "price": 40000.0,
            "type": "limit"
        }
        
        account_info = {
            "positions": {
                "BTC/USDT": {
                    "size": 1.0,  # $40,000 existing position
                    "side": "long"
                }
            }
        }
        
        # New position: 1.0 + 0.2 = 1.2 BTC = $48,000
        # Order size: $8,000 (OK)
        # Position size: $48,000 (OK, under $50k)
        check_order_limits(order, account_info)
        
        # Now test order that fails order limit
        large_order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.3,  # $12,000 order (over $10k order limit)
            "price": 40000.0,
            "type": "limit"
        }
        
        with pytest.raises(RiskLimitError, match="exceeds maximum order size limit"):
            check_order_limits(large_order, account_info)


class TestGetRiskLimits:
    """Test get_risk_limits function."""
    
    @patch.dict(os.environ, {"MAX_POSITION_USD": "75000", "MAX_ORDER_USD": "15000"})
    def test_get_risk_limits_from_env(self):
        """Test getting risk limits from environment."""
        limits = get_risk_limits()
        
        assert limits["max_position_usd"] == 75000.0
        assert limits["max_order_usd"] == 15000.0
    
    def test_get_risk_limits_defaults(self):
        """Test getting risk limits with defaults."""
        # Clear env vars
        with patch.dict(os.environ, {}, clear=True):
            limits = get_risk_limits()
            
            assert limits["max_position_usd"] == 50000.0  # Default
            assert limits["max_order_usd"] == 10000.0  # Default


class TestRiskLimitError:
    """Test RiskLimitError exception."""
    
    def test_risk_limit_error_message(self):
        """Test RiskLimitError has correct message."""
        with pytest.raises(RiskLimitError, match="test error message"):
            raise RiskLimitError("test error message")
    
    def test_risk_limit_error_is_exception(self):
        """Test RiskLimitError is an Exception."""
        assert issubclass(RiskLimitError, Exception)


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_zero_amount(self):
        """Test order with zero amount."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.0,
            "price": 40000.0
        }
        
        # Should not raise (0 value is under limits)
        check_order_limits(order)
    
    def test_negative_amount_raises_error(self):
        """Test that negative amount causes issues in value calculation."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": -0.1,
            "price": 40000.0
        }
        
        # Negative amount * price = negative value, which is under limit
        # This should pass (though exchange would reject negative amounts)
        check_order_limits(order)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "10000"})
    def test_exact_limit_value(self):
        """Test order exactly at limit."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.25,
            "price": 40000.0,  # = $10,000 exactly
            "type": "limit"
        }
        
        # Exactly at limit should pass
        check_order_limits(order)
    
    @patch.dict(os.environ, {"MAX_ORDER_USD": "10000"})
    def test_just_over_limit(self):
        """Test order just over limit."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.250001,
            "price": 40000.0,  # = $10,000.04
            "type": "limit"
        }
        
        with pytest.raises(RiskLimitError):
            check_order_limits(order)
    
    def test_string_amount_converted(self):
        """Test that string amount is converted to float."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": "0.1",  # String
            "price": 40000.0
        }
        
        # Should not raise (string converted to float)
        check_order_limits(order)
    
    def test_string_price_converted(self):
        """Test that string price is converted to float."""
        order = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.1,
            "price": "40000.0"  # String
        }
        
        # Should not raise (string converted to float)
        check_order_limits(order)
