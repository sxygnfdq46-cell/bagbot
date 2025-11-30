"""
Simple risk management module for order validation.

Enforces position size and order size limits based on environment variables.
"""

import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class RiskLimitError(Exception):
    """Raised when an order violates risk limits."""
    pass


def check_order_limits(
    order_payload: Dict[str, Any],
    account_info: Optional[Dict[str, Any]] = None
) -> None:
    """
    Check if order complies with risk limits.
    
    Enforces:
    - MAX_POSITION_USD: Maximum position size per symbol in USD
    - MAX_ORDER_USD: Maximum order size per order in USD
    
    Args:
        order_payload: Order parameters dict with keys:
            - symbol: Trading pair (e.g., "BTC/USDT")
            - side: "buy" or "sell"
            - amount: Order quantity
            - price: Price (for limit orders) or None (for market orders)
            - type: Order type (market, limit, etc.)
        account_info: Optional account information dict with keys:
            - positions: Dict of symbol -> position info
            - balance: Dict of asset -> balance info
    
    Raises:
        RiskLimitError: If order violates any risk limit
        ValueError: If required order fields are missing
    
    Example:
        >>> check_order_limits(
        ...     {
        ...         "symbol": "BTC/USDT",
        ...         "side": "buy",
        ...         "amount": 0.1,
        ...         "price": 40000.0,
        ...         "type": "limit"
        ...     }
        ... )
    """
    # Load risk limits from environment
    max_position_usd = float(os.getenv("MAX_POSITION_USD", "50000.0"))
    max_order_usd = float(os.getenv("MAX_ORDER_USD", "10000.0"))
    
    # Extract order details
    symbol = order_payload.get("symbol")
    side = order_payload.get("side")
    amount = order_payload.get("amount")
    price = order_payload.get("price")
    order_type = order_payload.get("type", "market")
    
    # Validate required fields
    if not symbol:
        raise ValueError("Order payload missing 'symbol'")
    if not side:
        raise ValueError("Order payload missing 'side'")
    if amount is None:
        raise ValueError("Order payload missing 'amount'")
    
    amount = float(amount)
    
    # For limit orders, we have a price
    # For market orders, we need to estimate (use price if provided, otherwise skip value check)
    order_value_usd = None
    if price is not None:
        order_value_usd = amount * float(price)
    
    # Check 1: Maximum order size
    if order_value_usd is not None and order_value_usd > max_order_usd:
        raise RiskLimitError(
            f"Order value ${order_value_usd:,.2f} exceeds maximum order size limit "
            f"of ${max_order_usd:,.2f} (MAX_ORDER_USD). "
            f"Reduce order size or adjust limit."
        )
    
    # Check 2: Maximum position size
    # Calculate what the new position would be after this order
    if account_info and "positions" in account_info:
        positions = account_info["positions"]
        current_position = positions.get(symbol, {})
        current_position_size = float(current_position.get("size", 0.0))
        current_position_side = current_position.get("side", "none")
        
        # Calculate new position size
        if side == "buy":
            if current_position_side in ["long", "none"]:
                # Adding to long or opening long
                new_position_size = current_position_size + amount
            else:  # short
                # Reducing short
                new_position_size = abs(current_position_size - amount)
        else:  # sell
            if current_position_side in ["short", "none"]:
                # Adding to short or opening short
                new_position_size = current_position_size + amount
            else:  # long
                # Reducing long
                new_position_size = abs(current_position_size - amount)
        
        # Check if new position would exceed limit
        if order_value_usd is not None:
            # Use order price to estimate position value
            new_position_value = new_position_size * float(price)
            
            if new_position_value > max_position_usd:
                raise RiskLimitError(
                    f"New position value ${new_position_value:,.2f} would exceed "
                    f"maximum position size limit of ${max_position_usd:,.2f} (MAX_POSITION_USD). "
                    f"Current position: {current_position_size} {symbol.split('/')[0]}, "
                    f"Order: {side} {amount}. "
                    f"Reduce order size or adjust limit."
                )
    
    logger.info(
        f"Risk check passed: {side} {amount} {symbol} "
        f"(order_value=${order_value_usd if order_value_usd is not None else 'N/A'})"
    )


def get_risk_limits() -> Dict[str, float]:
    """
    Get current risk limits from environment variables.
    
    Returns:
        Dict with current risk limits:
            - max_position_usd: Maximum position size per symbol
            - max_order_usd: Maximum order size per order
    
    Example:
        >>> limits = get_risk_limits()
        >>> print(f"Max order: ${limits['max_order_usd']:,.2f}")
    """
    return {
        "max_position_usd": float(os.getenv("MAX_POSITION_USD", "50000.0")),
        "max_order_usd": float(os.getenv("MAX_ORDER_USD", "10000.0")),
    }
