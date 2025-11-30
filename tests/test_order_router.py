"""
Unit tests for order routing functionality.

Tests the order router including:
- Connector loading
- Risk checks
- Order creation with mocked exchange
- Database persistence
"""

import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from backend.models import Base, Order
from trading.order_router import (
    route_order,
    load_connector,
    check_risk_limits,
    get_order_by_id,
    get_orders_by_user,
    update_order_status,
    RiskCheckError,
    ConnectorNotFoundError,
)


# Test database setup
@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture
def mock_connector():
    """Create a mocked exchange connector."""
    connector = AsyncMock()
    connector.create_order = AsyncMock(return_value={
        "id": "12345",
        "symbol": "BTC/USDT",
        "side": "buy",
        "type": "market",
        "status": "closed",
        "amount": 0.001,
        "filled": 0.001,
        "price": 50000.0,
    })
    connector.close = AsyncMock()
    return connector


class TestConnectorLoading:
    """Test connector loading functionality."""
    
    def test_load_binance_connector(self):
        """Test loading Binance connector."""
        connector = load_connector("binance", testnet=True)
        assert connector is not None
        assert connector.testnet is True
    
    def test_load_connector_case_insensitive(self):
        """Test connector loading is case-insensitive."""
        connector1 = load_connector("binance", testnet=True)
        connector2 = load_connector("BINANCE", testnet=True)
        connector3 = load_connector("Binance", testnet=True)
        
        assert all(c is not None for c in [connector1, connector2, connector3])
    
    def test_load_unknown_connector(self):
        """Test loading unknown connector raises error."""
        with pytest.raises(ConnectorNotFoundError) as exc_info:
            load_connector("unknown_exchange", testnet=True)
        
        assert "unknown_exchange" in str(exc_info.value)
        assert "binance" in str(exc_info.value).lower()


class TestRiskChecks:
    """Test risk check functionality."""
    
    def test_risk_check_passes_valid_order(self):
        """Test risk checks pass for valid order."""
        order_payload = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "amount": 0.001,
        }
        
        # Should not raise
        check_risk_limits(order_payload)
    
    def test_risk_check_fails_excessive_quantity(self):
        """Test risk check fails for excessive quantity."""
        with patch.dict(os.environ, {"MAX_ORDER_QTY": "1.0"}):
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "market",
                "amount": 10.0,  # Exceeds limit
            }
            
            with pytest.raises(RiskCheckError) as exc_info:
                check_risk_limits(order_payload)
            
            assert "exceeds maximum allowed quantity" in str(exc_info.value)
    
    def test_risk_check_fails_excessive_value(self):
        """Test risk check fails for excessive order value."""
        with patch.dict(os.environ, {"MAX_ORDER_VALUE_USD": "10000.0"}):
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "limit",
                "amount": 1.0,
                "price": 50000.0,  # $50k total value exceeds $10k limit
            }
            
            with pytest.raises(RiskCheckError) as exc_info:
                check_risk_limits(order_payload)
            
            assert "exceeds maximum allowed value" in str(exc_info.value)
    
    def test_risk_check_fails_below_minimum_quantity(self):
        """Test risk check fails for quantity below minimum."""
        with patch.dict(os.environ, {"MIN_ORDER_QTY": "0.001"}):
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "market",
                "amount": 0.00001,  # Below minimum
            }
            
            with pytest.raises(RiskCheckError) as exc_info:
                check_risk_limits(order_payload)
            
            assert "below minimum allowed quantity" in str(exc_info.value)
    
    def test_risk_check_fails_invalid_side(self):
        """Test risk check fails for invalid order side."""
        order_payload = {
            "symbol": "BTC/USDT",
            "side": "invalid",
            "type": "market",
            "amount": 0.001,
        }
        
        with pytest.raises(RiskCheckError) as exc_info:
            check_risk_limits(order_payload)
        
        assert "Invalid order side" in str(exc_info.value)
    
    def test_risk_check_fails_invalid_symbol(self):
        """Test risk check fails for invalid symbol format."""
        order_payload = {
            "symbol": "BTCUSDT",  # Missing slash
            "side": "buy",
            "type": "market",
            "amount": 0.001,
        }
        
        with pytest.raises(RiskCheckError) as exc_info:
            check_risk_limits(order_payload)
        
        assert "Invalid symbol format" in str(exc_info.value)


class TestOrderRouting:
    """Test order routing and database persistence."""
    
    @pytest.mark.asyncio
    async def test_route_order_success(self, db_session, mock_connector):
        """Test successful order routing creates database record."""
        order_payload = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "amount": 0.001,
        }
        
        with patch("trading.order_router.load_connector", return_value=mock_connector):
            order = await route_order(
                "binance",
                order_payload,
                db_session,
                user_id="test_user",
                testnet=True,
            )
        
        # Verify connector was called
        mock_connector.create_order.assert_called_once_with(order_payload)
        mock_connector.close.assert_called_once()
        
        # Verify database record
        assert order.id is not None
        assert order.user_id == "test_user"
        assert order.symbol == "BTC/USDT"
        assert order.qty == 0.001
        assert order.side == "buy"
        assert order.status == "filled"
        assert order.external_id == "12345"
        assert order.created_at is not None
        assert order.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_route_order_with_limit_price(self, db_session, mock_connector):
        """Test order routing with limit price."""
        order_payload = {
            "symbol": "ETH/USDT",
            "side": "sell",
            "type": "limit",
            "amount": 0.5,
            "price": 3000.0,
        }
        
        mock_connector.create_order.return_value = {
            "id": "67890",
            "symbol": "ETH/USDT",
            "side": "sell",
            "type": "limit",
            "status": "open",
            "amount": 0.5,
            "price": 3000.0,
            "filled": 0.0,
        }
        
        with patch("trading.order_router.load_connector", return_value=mock_connector):
            order = await route_order(
                "binance",
                order_payload,
                db_session,
                user_id="test_user",
                testnet=True,
            )
        
        assert order.price == 3000.0
        assert order.status == "open"
        assert order.external_id == "67890"
    
    @pytest.mark.asyncio
    async def test_route_order_risk_check_failure(self, db_session, mock_connector):
        """Test order routing when risk check fails."""
        with patch.dict(os.environ, {"MAX_ORDER_QTY": "0.0001"}):
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "market",
                "amount": 1.0,  # Exceeds limit
            }
            
            with patch("trading.order_router.load_connector", return_value=mock_connector):
                with pytest.raises(RiskCheckError):
                    await route_order(
                        "binance",
                        order_payload,
                        db_session,
                        user_id="test_user",
                        testnet=True,
                    )
            
            # Connector should NOT be called
            mock_connector.create_order.assert_not_called()
            
            # But order should still be saved with rejected status
            orders = db_session.query(Order).all()
            assert len(orders) == 1
            assert orders[0].status == "rejected"
            assert orders[0].external_id is None
    
    @pytest.mark.asyncio
    async def test_route_order_exchange_error(self, db_session, mock_connector):
        """Test order routing when exchange returns error."""
        order_payload = {
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "amount": 0.001,
        }
        
        # Simulate exchange error
        mock_connector.create_order.side_effect = Exception("Exchange error")
        
        with patch("trading.order_router.load_connector", return_value=mock_connector):
            with pytest.raises(Exception) as exc_info:
                await route_order(
                    "binance",
                    order_payload,
                    db_session,
                    user_id="test_user",
                    testnet=True,
                )
            
            assert "Exchange error" in str(exc_info.value)
        
        # Order should be saved with rejected status
        orders = db_session.query(Order).all()
        assert len(orders) == 1
        assert orders[0].status == "rejected"
        assert orders[0].external_id is None
    
    @pytest.mark.asyncio
    async def test_route_order_status_mapping(self, db_session, mock_connector):
        """Test that exchange status is correctly mapped to our status."""
        test_cases = [
            ({"status": "closed", "filled": 0.001}, "filled"),
            ({"status": "open", "filled": 0.0}, "open"),
            ({"status": "canceled", "filled": 0.0}, "canceled"),
            ({"status": "rejected", "filled": 0.0}, "rejected"),
        ]
        
        for exchange_response, expected_status in test_cases:
            # Reset session
            db_session.query(Order).delete()
            db_session.commit()
            
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "market",
                "amount": 0.001,
            }
            
            mock_connector.create_order.return_value = {
                "id": "test123",
                **exchange_response,
            }
            
            with patch("trading.order_router.load_connector", return_value=mock_connector):
                order = await route_order(
                    "binance",
                    order_payload,
                    db_session,
                    user_id="test_user",
                    testnet=True,
                )
            
            assert order.status == expected_status, f"Failed for {exchange_response}"


class TestOrderQueries:
    """Test order query functions."""
    
    def test_get_order_by_id(self, db_session):
        """Test getting order by ID."""
        # Create test order
        order = Order(
            user_id="test_user",
            symbol="BTC/USDT",
            qty=0.001,
            side="buy",
            status="filled",
            external_id="12345",
        )
        db_session.add(order)
        db_session.commit()
        
        # Retrieve order
        retrieved = get_order_by_id(db_session, order.id)
        assert retrieved is not None
        assert retrieved.id == order.id
        assert retrieved.external_id == "12345"
    
    def test_get_order_by_id_not_found(self, db_session):
        """Test getting non-existent order returns None."""
        retrieved = get_order_by_id(db_session, 99999)
        assert retrieved is None
    
    def test_get_orders_by_user(self, db_session):
        """Test getting orders for a user."""
        # Create multiple orders
        for i in range(5):
            order = Order(
                user_id="test_user",
                symbol="BTC/USDT",
                qty=0.001,
                side="buy",
                status="filled",
                external_id=f"order_{i}",
            )
            db_session.add(order)
        
        # Create order for different user
        order = Order(
            user_id="other_user",
            symbol="ETH/USDT",
            qty=0.5,
            side="sell",
            status="open",
            external_id="other_order",
        )
        db_session.add(order)
        db_session.commit()
        
        # Retrieve orders
        user_orders = get_orders_by_user(db_session, "test_user")
        assert len(user_orders) == 5
        assert all(o.user_id == "test_user" for o in user_orders)
    
    def test_get_orders_by_user_with_status_filter(self, db_session):
        """Test getting orders filtered by status."""
        # Create orders with different statuses
        for status in ["filled", "open", "canceled"]:
            order = Order(
                user_id="test_user",
                symbol="BTC/USDT",
                qty=0.001,
                side="buy",
                status=status,
                external_id=f"order_{status}",
            )
            db_session.add(order)
        db_session.commit()
        
        # Get only filled orders
        filled_orders = get_orders_by_user(db_session, "test_user", status="filled")
        assert len(filled_orders) == 1
        assert filled_orders[0].status == "filled"
    
    def test_get_orders_by_user_limit(self, db_session):
        """Test order limit parameter."""
        # Create 10 orders
        for i in range(10):
            order = Order(
                user_id="test_user",
                symbol="BTC/USDT",
                qty=0.001,
                side="buy",
                status="filled",
                external_id=f"order_{i}",
            )
            db_session.add(order)
        db_session.commit()
        
        # Get only 3 orders
        orders = get_orders_by_user(db_session, "test_user", limit=3)
        assert len(orders) == 3
    
    def test_update_order_status(self, db_session):
        """Test updating order status."""
        # Create order
        order = Order(
            user_id="test_user",
            symbol="BTC/USDT",
            qty=0.001,
            side="buy",
            status="open",
            external_id="12345",
        )
        db_session.add(order)
        db_session.commit()
        
        # Update status
        updated = update_order_status(db_session, order.id, "filled")
        
        assert updated is not None
        assert updated.status == "filled"
        assert updated.updated_at > updated.created_at
    
    def test_update_order_status_with_external_id(self, db_session):
        """Test updating order status and external ID."""
        # Create order without external ID
        order = Order(
            user_id="test_user",
            symbol="BTC/USDT",
            qty=0.001,
            side="buy",
            status="pending",
            external_id=None,
        )
        db_session.add(order)
        db_session.commit()
        
        # Update status and add external ID
        updated = update_order_status(
            db_session,
            order.id,
            "open",
            external_id="67890"
        )
        
        assert updated.status == "open"
        assert updated.external_id == "67890"
    
    def test_update_order_status_not_found(self, db_session):
        """Test updating non-existent order returns None."""
        updated = update_order_status(db_session, 99999, "filled")
        assert updated is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
