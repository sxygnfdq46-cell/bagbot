"""
Risk Manager
Performs risk checks on orders before execution
"""
import os
import logging
from typing import Optional
from dataclasses import dataclass
from sqlalchemy.orm import Session
from backend.models import TradingOrder, OrderStatusEnum
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class RiskCheckResult:
    """Result of risk check"""
    passed: bool
    reason: Optional[str] = None


class RiskManager:
    """
    Risk management system for order validation
    
    Performs checks:
    - Maximum order size limits
    - Maximum position size limits
    - Daily loss limits
    - Maximum open orders per symbol
    - Minimum order value
    """
    
    def __init__(self):
        # Load risk parameters from environment
        self.max_order_size_usd = float(os.getenv("MAX_ORDER_SIZE_USD", "10000"))
        self.max_position_size_usd = float(os.getenv("MAX_POSITION_SIZE_USD", "50000"))
        self.max_daily_loss_usd = float(os.getenv("MAX_DAILY_LOSS_USD", "5000"))
        self.max_open_orders_per_symbol = int(os.getenv("MAX_OPEN_ORDERS_PER_SYMBOL", "5"))
        self.min_order_value_usd = float(os.getenv("MIN_ORDER_VALUE_USD", "10"))
        
        logger.info(f"Risk Manager initialized with limits: "
                   f"max_order=${self.max_order_size_usd}, "
                   f"max_position=${self.max_position_size_usd}, "
                   f"max_daily_loss=${self.max_daily_loss_usd}")
    
    async def check_order(
        self,
        order: TradingOrder,
        db: Session,
        current_price: Optional[float] = None
    ) -> RiskCheckResult:
        """
        Perform comprehensive risk checks on an order
        
        Args:
            order: Order to check
            db: Database session
            current_price: Current market price (if known)
        
        Returns:
            RiskCheckResult with passed=True if all checks pass
        """
        try:
            # Check 1: Order size limit
            result = await self._check_order_size(order, current_price)
            if not result.passed:
                return result
            
            # Check 2: Position size limit
            result = await self._check_position_size(order, db, current_price)
            if not result.passed:
                return result
            
            # Check 3: Daily loss limit
            result = await self._check_daily_loss(order, db)
            if not result.passed:
                return result
            
            # Check 4: Maximum open orders per symbol
            result = await self._check_max_open_orders(order, db)
            if not result.passed:
                return result
            
            # Check 5: Minimum order value
            result = await self._check_min_order_value(order, current_price)
            if not result.passed:
                return result
            
            logger.info(f"Order {order.id} passed all risk checks")
            return RiskCheckResult(passed=True)
            
        except Exception as e:
            logger.error(f"Error during risk check: {e}")
            return RiskCheckResult(
                passed=False,
                reason=f"Risk check error: {str(e)}"
            )
    
    async def _check_order_size(
        self,
        order: TradingOrder,
        current_price: Optional[float]
    ) -> RiskCheckResult:
        """Check if order size exceeds maximum"""
        # Estimate order value
        price = current_price or order.price or 0
        if price == 0:
            # Can't check without price, allow it through
            logger.warning(f"Order {order.id}: Cannot check order size without price")
            return RiskCheckResult(passed=True)
        
        order_value_usd = order.quantity * price
        
        if order_value_usd > self.max_order_size_usd:
            return RiskCheckResult(
                passed=False,
                reason=f"Order size ${order_value_usd:.2f} exceeds maximum ${self.max_order_size_usd:.2f}"
            )
        
        return RiskCheckResult(passed=True)
    
    async def _check_position_size(
        self,
        order: TradingOrder,
        db: Session,
        current_price: Optional[float]
    ) -> RiskCheckResult:
        """Check if resulting position would exceed maximum"""
        # Calculate current position for this symbol
        # TODO: Query actual positions from exchange
        # For now, sum up filled orders
        
        open_orders = db.query(TradingOrder).filter(
            TradingOrder.user_id == order.user_id,
            TradingOrder.symbol == order.symbol,
            TradingOrder.status.in_([
                OrderStatusEnum.FILLED,
                OrderStatusEnum.PARTIALLY_FILLED
            ])
        ).all()
        
        current_position = sum(
            o.filled_quantity * (1 if o.side == 'buy' else -1)
            for o in open_orders
        )
        
        # Calculate new position after this order
        new_quantity = order.quantity if order.side == 'buy' else -order.quantity
        new_position = current_position + new_quantity
        
        # Check position size in USD
        price = current_price or order.price or 0
        if price > 0:
            position_value_usd = abs(new_position) * price
            
            if position_value_usd > self.max_position_size_usd:
                return RiskCheckResult(
                    passed=False,
                    reason=f"Position size ${position_value_usd:.2f} would exceed maximum ${self.max_position_size_usd:.2f}"
                )
        
        return RiskCheckResult(passed=True)
    
    async def _check_daily_loss(
        self,
        order: TradingOrder,
        db: Session
    ) -> RiskCheckResult:
        """Check if daily loss limit has been reached"""
        # Calculate P&L for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_orders = db.query(TradingOrder).filter(
            TradingOrder.user_id == order.user_id,
            TradingOrder.created_at >= today_start,
            TradingOrder.status == OrderStatusEnum.FILLED
        ).all()
        
        # Simple P&L calculation (buy at X, sell at Y)
        # TODO: Implement proper P&L calculation with actual fill prices
        daily_pnl = 0.0  # Placeholder
        
        # For now, just allow orders through
        # In production, calculate actual P&L from filled orders
        if daily_pnl < -self.max_daily_loss_usd:
            return RiskCheckResult(
                passed=False,
                reason=f"Daily loss ${abs(daily_pnl):.2f} exceeds limit ${self.max_daily_loss_usd:.2f}"
            )
        
        return RiskCheckResult(passed=True)
    
    async def _check_max_open_orders(
        self,
        order: TradingOrder,
        db: Session
    ) -> RiskCheckResult:
        """Check if max open orders per symbol is exceeded"""
        open_orders_count = db.query(TradingOrder).filter(
            TradingOrder.user_id == order.user_id,
            TradingOrder.symbol == order.symbol,
            TradingOrder.status.in_([
                OrderStatusEnum.PENDING,
                OrderStatusEnum.OPEN,
                OrderStatusEnum.PARTIALLY_FILLED
            ])
        ).count()
        
        if open_orders_count >= self.max_open_orders_per_symbol:
            return RiskCheckResult(
                passed=False,
                reason=f"Maximum {self.max_open_orders_per_symbol} open orders per symbol exceeded"
            )
        
        return RiskCheckResult(passed=True)
    
    async def _check_min_order_value(
        self,
        order: TradingOrder,
        current_price: Optional[float]
    ) -> RiskCheckResult:
        """Check if order meets minimum value requirement"""
        price = current_price or order.price or 0
        if price == 0:
            # Can't check without price, allow it through
            return RiskCheckResult(passed=True)
        
        order_value_usd = order.quantity * price
        
        if order_value_usd < self.min_order_value_usd:
            return RiskCheckResult(
                passed=False,
                reason=f"Order value ${order_value_usd:.2f} below minimum ${self.min_order_value_usd:.2f}"
            )
        
        return RiskCheckResult(passed=True)
