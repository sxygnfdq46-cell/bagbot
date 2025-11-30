"""
Order routing module for handling order execution through exchange connectors.

This module provides the main order routing logic including:
- Connector loading by name
- Risk checks before order execution
- Order creation through exchange connectors
- Database persistence of order details
"""

import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from trading.connectors import IExchangeConnector, BinanceConnector
from backend.models import Order
from trading.risk import check_order_limits, RiskLimitError

logger = logging.getLogger(__name__)


class RiskCheckError(Exception):
    """Raised when risk checks fail (legacy, use RiskLimitError from risk.py)"""
    pass


class ConnectorNotFoundError(Exception):
    """Raised when connector name is not supported"""
    pass


# Registry of available connectors
CONNECTOR_REGISTRY = {
    "binance": BinanceConnector,
    # Add more connectors here as they're implemented
    # "coinbase": CoinbaseConnector,
    # "kraken": KrakenConnector,
}


def load_connector(connector_name: str, testnet: bool = True, **kwargs) -> IExchangeConnector:
    """
    Load exchange connector by name.
    
    Args:
        connector_name: Name of the connector ('binance', 'coinbase', etc.)
        testnet: Whether to use testnet/sandbox mode
        **kwargs: Additional connector-specific parameters
    
    Returns:
        Initialized connector instance
    
    Raises:
        ConnectorNotFoundError: If connector name is not supported
    """
    connector_name = connector_name.lower()
    
    if connector_name not in CONNECTOR_REGISTRY:
        raise ConnectorNotFoundError(
            f"Connector '{connector_name}' not found. "
            f"Available connectors: {', '.join(CONNECTOR_REGISTRY.keys())}"
        )
    
    connector_class = CONNECTOR_REGISTRY[connector_name]
    
    logger.info(f"Loading connector: {connector_name} (testnet={testnet})")
    
    return connector_class(testnet=testnet, **kwargs)


def check_risk_limits(order_payload: Dict[str, Any]) -> None:
    """
    Perform risk checks on order before execution.
    
    Args:
        order_payload: Order parameters including symbol, amount, side, etc.
    
    Raises:
        RiskCheckError: If any risk check fails
    """
    # Get risk limits from environment variables with defaults
    max_qty = float(os.getenv("MAX_ORDER_QTY", "10.0"))
    max_order_value_usd = float(os.getenv("MAX_ORDER_VALUE_USD", "100000.0"))
    
    # Extract order details
    symbol = order_payload.get("symbol", "")
    amount = float(order_payload.get("amount", 0))
    price = order_payload.get("price")
    order_type = order_payload.get("type", "market")
    
    # Check 1: Maximum quantity limit
    if amount > max_qty:
        raise RiskCheckError(
            f"Order quantity {amount} exceeds maximum allowed quantity {max_qty} "
            f"(set MAX_ORDER_QTY environment variable to adjust)"
        )
    
    # Check 2: Maximum order value (if price is available)
    if price is not None:
        order_value = amount * float(price)
        if order_value > max_order_value_usd:
            raise RiskCheckError(
                f"Order value ${order_value:,.2f} exceeds maximum allowed value "
                f"${max_order_value_usd:,.2f} "
                f"(set MAX_ORDER_VALUE_USD environment variable to adjust)"
            )
    
    # Check 3: Minimum quantity (prevent dust orders)
    min_qty = float(os.getenv("MIN_ORDER_QTY", "0.0001"))
    if amount < min_qty:
        raise RiskCheckError(
            f"Order quantity {amount} is below minimum allowed quantity {min_qty}"
        )
    
    # Check 4: Valid side
    side = order_payload.get("side", "").lower()
    if side not in ["buy", "sell"]:
        raise RiskCheckError(f"Invalid order side: {side}. Must be 'buy' or 'sell'")
    
    # Check 5: Valid symbol format
    if not symbol or "/" not in symbol:
        raise RiskCheckError(
            f"Invalid symbol format: {symbol}. Expected format: 'BTC/USDT'"
        )
    
    logger.info(f"Risk checks passed for {side} {amount} {symbol}")


async def route_order(
    connector_name: str,
    order_payload: Dict[str, Any],
    db: Session,
    user_id: str = "default_user",
    testnet: bool = True,
) -> Order:
    """
    Route an order through the specified exchange connector.
    
    This function:
    1. Loads the appropriate connector
    2. Performs risk checks
    3. Creates the order on the exchange
    4. Stores order details in the database
    
    Args:
        connector_name: Name of exchange connector ('binance', 'coinbase', etc.)
        order_payload: Order parameters dict with keys:
            - symbol: Trading pair (e.g., "BTC/USDT")
            - side: "buy" or "sell"
            - type: "market", "limit", etc.
            - amount: Order quantity
            - price: Limit price (optional, for limit orders)
        db: SQLAlchemy database session
        user_id: User identifier for the order
        testnet: Whether to use testnet/sandbox mode (default True for safety)
    
    Returns:
        Order: Created order object with external_id from exchange
    
    Raises:
        ConnectorNotFoundError: If connector is not supported
        RiskCheckError: If risk checks fail
        Exception: If order creation on exchange fails
    
    Example:
        >>> order = await route_order(
        ...     "binance",
        ...     {
        ...         "symbol": "BTC/USDT",
        ...         "side": "buy",
        ...         "type": "market",
        ...         "amount": 0.001
        ...     },
        ...     db
        ... )
        >>> print(f"Order created: {order.external_id}")
    """
    try:
        # Step 1: Perform risk checks first (before connector initialization)
        logger.info(f"Processing order: {order_payload}")
        
        # Use both old and new risk checks for backward compatibility
        check_risk_limits(order_payload)  # Legacy checks
        
        # Step 1b: Fetch account info for position-based risk checks
        connector = load_connector(connector_name, testnet=testnet)
        try:
            balance = await connector.fetch_balance()
            account_info = {"balance": balance, "positions": {}}
            # Note: Position tracking would need to be implemented separately
            # For now, check_order_limits will work without position info
        except Exception as e:
            logger.warning(f"Could not fetch account info for risk check: {e}")
            account_info = None
        
        # New risk checks from risk.py
        check_order_limits(order_payload, account_info)
        
        # Step 2: Connector already loaded above
        # connector = load_connector(connector_name, testnet=testnet)
        
        # Step 3: Create order on exchange
        logger.info(f"Creating order on {connector_name}: {order_payload}")
        exchange_order = await connector.create_order(order_payload)
        
        # Step 4: Extract order details from exchange response
        external_id = exchange_order.get("id")
        status = exchange_order.get("status", "open")
        filled = exchange_order.get("filled", 0.0)
        
        # Map exchange status to our status
        if status == "closed" and filled > 0:
            status = "filled"
        elif status == "canceled":
            status = "canceled"
        elif status == "rejected":
            status = "rejected"
        else:
            status = "open"
        
        # Step 5: Create database record
        db_order = Order(
            user_id=user_id,
            symbol=order_payload["symbol"],
            qty=float(order_payload["amount"]),
            price=float(order_payload.get("price")) if order_payload.get("price") else None,
            side=order_payload["side"].lower(),
            status=status,
            external_id=external_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        logger.info(
            f"Order created successfully: DB ID={db_order.id}, "
            f"External ID={external_id}, Status={status}"
        )
        
        # Step 6: Close connector
        await connector.close()
        
        return db_order
    
    except (RiskCheckError, RiskLimitError) as e:
        logger.error(f"Risk check failed: {e}")
        # Create order record with rejected status
        db_order = Order(
            user_id=user_id,
            symbol=order_payload.get("symbol", "UNKNOWN"),
            qty=float(order_payload.get("amount", 0)),
            price=float(order_payload.get("price")) if order_payload.get("price") else None,
            side=order_payload.get("side", "buy").lower(),
            status="rejected",
            external_id=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        raise
    
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        # Create order record with rejected status
        db_order = Order(
            user_id=user_id,
            symbol=order_payload.get("symbol", "UNKNOWN"),
            qty=float(order_payload.get("amount", 0)),
            price=float(order_payload.get("price")) if order_payload.get("price") else None,
            side=order_payload.get("side", "buy").lower(),
            status="rejected",
            external_id=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        raise


def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
    """
    Get order by database ID.
    
    Args:
        db: SQLAlchemy database session
        order_id: Order database ID
    
    Returns:
        Order object or None if not found
    """
    return db.query(Order).filter(Order.id == order_id).first()


def get_orders_by_user(
    db: Session,
    user_id: str,
    limit: int = 100,
    status: Optional[str] = None
) -> list[Order]:
    """
    Get orders for a specific user.
    
    Args:
        db: SQLAlchemy database session
        user_id: User identifier
        limit: Maximum number of orders to return
        status: Filter by status (optional)
    
    Returns:
        List of Order objects
    """
    query = db.query(Order).filter(Order.user_id == user_id)
    
    if status:
        query = query.filter(Order.status == status)
    
    return query.order_by(Order.created_at.desc()).limit(limit).all()


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
    external_id: Optional[str] = None
) -> Optional[Order]:
    """
    Update order status.
    
    Args:
        db: SQLAlchemy database session
        order_id: Order database ID
        status: New status
        external_id: Exchange order ID (optional)
    
    Returns:
        Updated Order object or None if not found
    """
    order = get_order_by_id(db, order_id)
    
    if order:
        order.status = status
        order.updated_at = datetime.utcnow()
        
        if external_id:
            order.external_id = external_id
        
        db.commit()
        db.refresh(order)
        logger.info(f"Updated order {order_id} status to {status}")
    
    return order
