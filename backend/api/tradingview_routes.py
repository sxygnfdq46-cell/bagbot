"""
TradingView Webhook Integration
Handles incoming signals from TradingView alerts and routes them through order_router
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from backend.models import get_db
from worker.executor.order_router import route_order, RiskCheckError, ConnectorNotFoundError
from datetime import datetime
import hmac
import hashlib
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tradingview", tags=["tradingview"])

# TradingView webhook secret for verification
TRADINGVIEW_SECRET = os.getenv("TRADINGVIEW_SECRET", "")


class TradingViewSignal(BaseModel):
    """TradingView webhook signal format"""
    symbol: str = Field(..., description="Trading pair (e.g., BTC/USDT)")
    side: str = Field(..., description="Order side: buy or sell")
    qty: float = Field(..., gt=0, description="Order quantity")
    price: Optional[float] = Field(None, description="Limit price (optional)")
    type: str = Field(default="market", description="Order type: market, limit")
    
    # Optional fields for backward compatibility and additional info
    secret: Optional[str] = Field(None, description="Secret key for authentication")
    user_id: Optional[str] = Field(default="tradingview", description="User identifier")
    
    @validator("side")
    def validate_side(cls, v):
        """Validate order side."""
        if v.lower() not in ["buy", "sell"]:
            raise ValueError(f"Invalid side: {v}. Must be 'buy' or 'sell'")
        return v.lower()
    
    @validator("type")
    def validate_type(cls, v):
        """Validate order type."""
        if v.lower() not in ["market", "limit"]:
            raise ValueError(f"Invalid type: {v}. Must be 'market' or 'limit'")
        return v.lower()


class WebhookResponse(BaseModel):
    """Response model for webhook"""
    success: bool
    message: str
    order_id: Optional[int] = None
    external_id: Optional[str] = None


def verify_tradingview_signature(payload: bytes, signature: str) -> bool:
    """
    Verify TradingView webhook signature
    
    Args:
        payload: Raw request body
        signature: Signature from header
    
    Returns:
        True if signature is valid
    """
    if not TRADINGVIEW_SECRET:
        logger.warning("TRADINGVIEW_SECRET not configured, skipping signature verification")
        return True  # Allow in development, but log warning
    
    try:
        expected_signature = hmac.new(
            TRADINGVIEW_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False


@router.post("/webhook", response_model=WebhookResponse)
async def tradingview_webhook(
    request: Request,
    signal: TradingViewSignal,
    x_tradingview_sign: Optional[str] = Header(None, alias="X-TradingView-Sign"),
    db: Session = Depends(get_db)
):
    """
    Receive and process TradingView webhook signals
    
    **Authentication:**
    - Method 1: `X-TradingView-Sign` header with HMAC-SHA256 signature
    - Method 2: `secret` field in payload matching TRADINGVIEW_SECRET
    
    **Signal format:**
    ```json
    {
        "symbol": "BTC/USDT",
        "side": "buy",
        "qty": 0.001,
        "price": 50000,
        "type": "market"
    }
    ```
    
    **Example TradingView Alert Message:**
    ```
    {
        "symbol": "{{ticker}}",
        "side": "buy",
        "qty": 0.001,
        "type": "market"
    }
    ```
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Verify authentication (header signature or payload secret)
        if TRADINGVIEW_SECRET:
            # Check header signature first
            if x_tradingview_sign:
                if not verify_tradingview_signature(body, x_tradingview_sign):
                    logger.warning("Invalid TradingView signature in header")
                    raise HTTPException(status_code=401, detail="Invalid signature")
            # Fall back to payload secret
            elif signal.secret:
                if signal.secret != TRADINGVIEW_SECRET:
                    logger.warning("Invalid TradingView secret in payload")
                    raise HTTPException(status_code=401, detail="Invalid secret")
            else:
                logger.warning("No signature or secret provided")
                raise HTTPException(
                    status_code=401,
                    detail="Authentication required: provide X-TradingView-Sign header or secret in payload"
                )
        
        logger.info(f"Received TradingView signal: {signal.side} {signal.qty} {signal.symbol}")
        
        # Convert signal to order payload
        order_payload = {
            "symbol": signal.symbol,
            "side": signal.side,
            "type": signal.type,
            "amount": signal.qty,
        }
        
        # Add price for limit orders
        if signal.price is not None:
            order_payload["price"] = signal.price
        
        # Route order through order router
        order = await route_order(
            connector_name="binance",
            order_payload=order_payload,
            db=db,
            user_id=signal.user_id or "tradingview",
            testnet=os.getenv("BINANCE_TESTNET", "true").lower() == "true"
        )
        
        logger.info(
            f"TradingView order created: DB ID={order.id}, "
            f"External ID={order.external_id}, Status={order.status}"
        )
        
        return WebhookResponse(
            success=True,
            message=f"Order created: {order.side} {order.qty} {order.symbol}",
            order_id=order.id,
            external_id=order.external_id
        )
    
    except RiskCheckError as e:
        logger.error(f"Risk check failed for TradingView signal: {e}")
        raise HTTPException(status_code=400, detail=f"Risk check failed: {str(e)}")
    
    except ConnectorNotFoundError as e:
        logger.error(f"Connector error: {e}")
        raise HTTPException(status_code=500, detail="Trading connector unavailable")
    
    except ValueError as e:
        logger.error(f"Invalid signal data: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid signal: {str(e)}")
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error processing TradingView webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process webhook")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for TradingView webhook
    
    Returns webhook configuration status
    """
    return {
        "status": "operational",
        "webhook_url": "/api/tradingview/webhook",
        "authentication": "enabled" if TRADINGVIEW_SECRET else "disabled",
        "connector": "binance",
        "testnet": os.getenv("BINANCE_TESTNET", "true").lower() == "true"
    }
