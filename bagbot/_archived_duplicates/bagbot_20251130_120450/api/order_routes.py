"""
Order Management Routes
Endpoints for creating, viewing, and managing orders
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.models import TradingOrder, OrderSourceEnum, OrderStatusEnum, get_db
from trading.risk_manager import RiskManager
from trading.order_executor import OrderExecutor
from typing import List, Optional
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["orders"])


class CreateOrderRequest(BaseModel):
    """Request model for creating orders"""
    symbol: str = Field(..., description="Trading pair (e.g., BTCUSDT)")
    side: str = Field(..., description="Order side: buy or sell")
    order_type: str = Field(default="market", description="Order type: market, limit, stop_loss")
    quantity: float = Field(..., gt=0, description="Order quantity")
    price: Optional[float] = Field(None, description="Limit price (required for limit orders)")
    stop_price: Optional[float] = Field(None, description="Stop price (for stop orders)")
    user_id: str = Field(default="api", description="User identifier")


class OrderResponse(BaseModel):
    """Response model for order details"""
    id: int
    client_order_id: str
    exchange_order_id: Optional[str]
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float]
    status: str
    filled_quantity: float
    remaining_quantity: Optional[float]
    average_fill_price: Optional[float]
    source: str
    created_at: datetime
    updated_at: datetime
    filled_at: Optional[datetime]
    risk_check_passed: str
    risk_check_reason: Optional[str]


@router.post("/create", response_model=OrderResponse)
async def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new trading order
    
    Validates order parameters, performs risk checks, and submits to exchange
    """
    try:
        # Validate side
        if request.side not in ['buy', 'sell']:
            raise HTTPException(status_code=400, detail="Side must be 'buy' or 'sell'")
        
        # Validate order type
        if request.order_type not in ['market', 'limit', 'stop_loss', 'take_profit']:
            raise HTTPException(status_code=400, detail="Invalid order type")
        
        # Validate price for limit orders
        if request.order_type == 'limit' and not request.price:
            raise HTTPException(status_code=400, detail="Limit orders require price")
        
        # Generate client order ID
        client_order_id = f"api_{request.symbol}_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # Create order record
        order = TradingOrder(
            user_id=request.user_id,
            exchange="binance",  # TODO: Make configurable
            client_order_id=client_order_id,
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            price=request.price,
            stop_price=request.stop_price,
            status=OrderStatusEnum.PENDING,
            remaining_quantity=request.quantity,
            source=OrderSourceEnum.API,
            metadata=json.dumps({"api_request": request.dict()})
        )
        
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # Run risk checks
        risk_manager = RiskManager()
        risk_result = await risk_manager.check_order(order, db, current_price=request.price)
        
        if not risk_result.passed:
            order.risk_check_passed = "failed"
            order.risk_check_reason = risk_result.reason
            order.status = OrderStatusEnum.REJECTED
            db.commit()
            
            raise HTTPException(status_code=400, detail=f"Risk check failed: {risk_result.reason}")
        
        order.risk_check_passed = "passed"
        db.commit()
        
        # Execute order
        executor = OrderExecutor()
        await executor.execute_order(order, db)
        
        db.refresh(order)
        
        return OrderResponse(
            id=order.id,
            client_order_id=order.client_order_id,
            exchange_order_id=order.exchange_order_id,
            symbol=order.symbol,
            side=order.side,
            order_type=order.order_type,
            quantity=order.quantity,
            price=order.price,
            status=order.status.value,
            filled_quantity=order.filled_quantity,
            remaining_quantity=order.remaining_quantity,
            average_fill_price=order.average_fill_price,
            source=order.source.value,
            created_at=order.created_at,
            updated_at=order.updated_at,
            filled_at=order.filled_at,
            risk_check_passed=order.risk_check_passed,
            risk_check_reason=order.risk_check_reason
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=List[OrderResponse])
async def list_orders(
    user_id: str = Query(default="api"),
    symbol: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    """
    List orders with optional filters
    
    Args:
        user_id: Filter by user
        symbol: Filter by trading pair
        status: Filter by status (pending, open, filled, canceled, etc.)
        limit: Maximum number of orders to return
    """
    query = db.query(TradingOrder).filter(TradingOrder.user_id == user_id)
    
    if symbol:
        query = query.filter(TradingOrder.symbol == symbol)
    
    if status:
        try:
            status_enum = OrderStatusEnum[status.upper()]
            query = query.filter(TradingOrder.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    orders = query.order_by(TradingOrder.created_at.desc()).limit(limit).all()
    
    return [
        OrderResponse(
            id=o.id,
            client_order_id=o.client_order_id,
            exchange_order_id=o.exchange_order_id,
            symbol=o.symbol,
            side=o.side,
            order_type=o.order_type,
            quantity=o.quantity,
            price=o.price,
            status=o.status.value,
            filled_quantity=o.filled_quantity,
            remaining_quantity=o.remaining_quantity,
            average_fill_price=o.average_fill_price,
            source=o.source.value,
            created_at=o.created_at,
            updated_at=o.updated_at,
            filled_at=o.filled_at,
            risk_check_passed=o.risk_check_passed,
            risk_check_reason=o.risk_check_reason
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Get details of a specific order"""
    order = db.query(TradingOrder).filter(TradingOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        id=order.id,
        client_order_id=order.client_order_id,
        exchange_order_id=order.exchange_order_id,
        symbol=order.symbol,
        side=order.side,
        order_type=order.order_type,
        quantity=order.quantity,
        price=order.price,
        status=order.status.value,
        filled_quantity=order.filled_quantity,
        remaining_quantity=order.remaining_quantity,
        average_fill_price=order.average_fill_price,
        source=order.source.value,
        created_at=order.created_at,
        updated_at=order.updated_at,
        filled_at=order.filled_at,
        risk_check_passed=order.risk_check_passed,
        risk_check_reason=order.risk_check_reason
    )


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Cancel an open order"""
    order = db.query(TradingOrder).filter(TradingOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.is_terminal_state():
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in {order.status.value} state")
    
    try:
        executor = OrderExecutor()
        await executor.cancel_order(order, db)
        
        return {"status": "success", "message": f"Order {order_id} canceled"}
        
    except Exception as e:
        logger.error(f"Error canceling order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{order_id}/refresh")
async def refresh_order_status(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Refresh order status from exchange"""
    order = db.query(TradingOrder).filter(TradingOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        executor = OrderExecutor()
        await executor.update_order_status(order, db)
        
        return {
            "status": "success",
            "order_status": order.status.value,
            "filled": order.filled_quantity
        }
        
    except Exception as e:
        logger.error(f"Error refreshing order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
