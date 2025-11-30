"""
Order Executor
Handles actual order execution on exchanges
"""
import logging
from sqlalchemy.orm import Session
from backend.models import TradingOrder, OrderStatusEnum
from trading.binance_connector import BinanceConnector
from trading.exchange_interface import OrderSide, OrderType
from datetime import datetime

logger = logging.getLogger(__name__)


class OrderExecutor:
    """
    Executes orders on exchanges
    Manages exchange connector lifecycle
    """
    
    def __init__(self):
        self.connectors = {}
    
    async def get_connector(self, exchange: str):
        """Get or create exchange connector"""
        if exchange not in self.connectors:
            if exchange == "binance":
                connector = BinanceConnector()
                await connector.connect()
                self.connectors[exchange] = connector
            else:
                raise ValueError(f"Unsupported exchange: {exchange}")
        
        return self.connectors[exchange]
    
    async def execute_order(self, order: TradingOrder, db: Session):
        """
        Execute order on exchange
        
        Args:
            order: Order to execute
            db: Database session
        """
        try:
            # Get exchange connector
            connector = await self.get_connector(order.exchange)
            
            # Map order parameters
            side = OrderSide.BUY if order.side == 'buy' else OrderSide.SELL
            order_type = self._map_order_type(order.order_type)
            
            # Create order on exchange
            logger.info(f"Executing order {order.id} on {order.exchange}")
            
            exchange_order = await connector.create_order(
                symbol=order.symbol,
                side=side,
                order_type=order_type,
                quantity=order.quantity,
                price=order.price,
                stop_price=order.stop_price,
                client_order_id=order.client_order_id
            )
            
            # Update order with exchange response
            order.exchange_order_id = exchange_order.id
            order.status = self._map_status(exchange_order.status)
            order.filled_quantity = exchange_order.filled
            order.remaining_quantity = exchange_order.remaining
            
            if exchange_order.filled > 0:
                order.average_fill_price = exchange_order.price
            
            if order.status == OrderStatusEnum.FILLED:
                order.filled_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"Order {order.id} executed successfully. Exchange ID: {exchange_order.id}")
            
        except Exception as e:
            logger.error(f"Error executing order {order.id}: {e}")
            order.status = OrderStatusEnum.REJECTED
            order.risk_check_reason = f"Execution error: {str(e)}"
            db.commit()
            raise
    
    async def cancel_order(self, order: TradingOrder, db: Session):
        """
        Cancel order on exchange
        
        Args:
            order: Order to cancel
            db: Database session
        """
        try:
            if not order.exchange_order_id:
                raise ValueError("Cannot cancel order without exchange order ID")
            
            connector = await self.get_connector(order.exchange)
            
            exchange_order = await connector.cancel_order(
                symbol=order.symbol,
                order_id=order.exchange_order_id
            )
            
            order.status = OrderStatusEnum.CANCELED
            order.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Order {order.id} canceled successfully")
            
        except Exception as e:
            logger.error(f"Error canceling order {order.id}: {e}")
            raise
    
    async def update_order_status(self, order: TradingOrder, db: Session):
        """
        Fetch and update order status from exchange
        
        Args:
            order: Order to update
            db: Database session
        """
        try:
            if not order.exchange_order_id:
                logger.warning(f"Order {order.id} has no exchange order ID")
                return
            
            connector = await self.get_connector(order.exchange)
            
            exchange_order = await connector.fetch_order(
                symbol=order.symbol,
                order_id=order.exchange_order_id
            )
            
            order.status = self._map_status(exchange_order.status)
            order.filled_quantity = exchange_order.filled
            order.remaining_quantity = exchange_order.remaining
            
            if exchange_order.filled > 0 and not order.average_fill_price:
                order.average_fill_price = exchange_order.price
            
            if order.status == OrderStatusEnum.FILLED and not order.filled_at:
                order.filled_at = datetime.utcnow()
            
            order.updated_at = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            logger.error(f"Error updating order status for {order.id}: {e}")
            raise
    
    def _map_order_type(self, order_type_str: str) -> OrderType:
        """Map string order type to OrderType enum"""
        mapping = {
            'market': OrderType.MARKET,
            'limit': OrderType.LIMIT,
            'stop_loss': OrderType.STOP_LOSS,
            'take_profit': OrderType.TAKE_PROFIT,
        }
        return mapping.get(order_type_str, OrderType.MARKET)
    
    def _map_status(self, exchange_status) -> OrderStatusEnum:
        """Map exchange status to our OrderStatusEnum"""
        from trading.exchange_interface import OrderStatus
        
        mapping = {
            OrderStatus.PENDING: OrderStatusEnum.PENDING,
            OrderStatus.OPEN: OrderStatusEnum.OPEN,
            OrderStatus.FILLED: OrderStatusEnum.FILLED,
            OrderStatus.PARTIALLY_FILLED: OrderStatusEnum.PARTIALLY_FILLED,
            OrderStatus.CANCELED: OrderStatusEnum.CANCELED,
            OrderStatus.REJECTED: OrderStatusEnum.REJECTED,
            OrderStatus.EXPIRED: OrderStatusEnum.EXPIRED,
        }
        return mapping.get(exchange_status, OrderStatusEnum.PENDING)
    
    async def cleanup(self):
        """Cleanup all connectors"""
        for connector in self.connectors.values():
            await connector.disconnect()
        self.connectors.clear()
