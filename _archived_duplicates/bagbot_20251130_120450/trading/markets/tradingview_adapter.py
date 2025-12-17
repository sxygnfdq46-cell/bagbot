"""
TradingView Adapter - Webhook receiver for TradingView signals.

Converts TradingView indicator signals → BAGBOT2 strategy calls.
Perfect for indicator-based strategies.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException

from bagbot.trading.markets.market_adapter import (
    MarketAdapter,
    MarketType,
    OrderSide,
    Signal as TradingSignal
)

logger = logging.getLogger(__name__)


# FastAPI router for webhook endpoint
router = APIRouter(prefix="/tradingview", tags=["tradingview"])


class TradingViewAdapter:
    """
    TradingView webhook adapter.
    
    Receives signals from TradingView alerts and converts them
    to BAGBOT2 trading signals.
    
    Webhook Format:
    {
        "symbol": "BTCUSDT",
        "action": "buy" | "sell" | "close",
        "price": 50000.0,
        "indicator": "RSI_MACD",
        "timeframe": "15m",
        "timestamp": "2024-11-24T10:30:00Z"
    }
    """
    
    def __init__(self, webhook_secret: Optional[str] = None):
        """
        Initialize TradingView adapter.
        
        Args:
            webhook_secret: Optional secret for webhook authentication
        """
        self.webhook_secret = webhook_secret
        self.received_signals = []
        self.signal_queue = []
        
        logger.info("📊 TradingView adapter initialized")
    
    async def process_webhook(
        self,
        payload: Dict[str, Any],
        secret: Optional[str] = None
    ) -> TradingSignal:
        """
        Process incoming TradingView webhook.
        
        Args:
            payload: Webhook payload
            secret: Authentication secret
            
        Returns:
            Trading signal
        """
        # Verify secret if configured
        if self.webhook_secret and secret != self.webhook_secret:
            logger.error("❌ Invalid webhook secret")
            raise HTTPException(status_code=401, detail="Invalid secret")
        
        # Extract signal data
        symbol = payload.get("symbol")
        action = payload.get("action", "").lower()
        price = payload.get("price", 0.0)
        indicator = payload.get("indicator", "Unknown")
        timeframe = payload.get("timeframe", "1h")
        
        if not symbol or not action:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Convert action to order side
        if action == "buy":
            side = OrderSide.BUY
        elif action == "sell":
            side = OrderSide.SELL
        elif action == "close":
            # Close position signal
            side = None
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
        
        # Create trading signal
        signal = TradingSignal(
            symbol=symbol,
            side=side,
            price=price,
            indicator=indicator,
            timeframe=timeframe,
            timestamp=datetime.now(),
            source="TradingView"
        )
        
        # Add to queue
        self.signal_queue.append(signal)
        self.received_signals.append(signal)
        
        logger.info(
            f"📨 TradingView signal: {action.upper()} {symbol} @ {price} "
            f"({indicator}/{timeframe})"
        )
        
        return signal
    
    def get_latest_signal(self) -> Optional[TradingSignal]:
        """
        Get latest signal from queue.
        
        Returns:
            Latest signal or None
        """
        if self.signal_queue:
            return self.signal_queue.pop(0)
        return None
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get adapter statistics."""
        return {
            "total_signals": len(self.received_signals),
            "queued_signals": len(self.signal_queue),
            "latest_signal": (
                {
                    "symbol": self.received_signals[-1].symbol,
                    "action": self.received_signals[-1].side.value if self.received_signals[-1].side else "close",
                    "timestamp": self.received_signals[-1].timestamp.isoformat()
                }
                if self.received_signals else None
            )
        }


# Global adapter instance
tradingview_adapter = TradingViewAdapter()


@router.post("/webhook")
async def tradingview_webhook(request: Request):
    """
    TradingView webhook endpoint.
    
    Example curl:
    ```
    curl -X POST http://localhost:8000/tradingview/webhook \
      -H "Content-Type: application/json" \
      -d '{
        "symbol": "BTCUSDT",
        "action": "buy",
        "price": 50000.0,
        "indicator": "RSI_MACD",
        "timeframe": "15m"
      }'
    ```
    """
    try:
        payload = await request.json()
        secret = request.headers.get("X-Webhook-Secret")
        
        signal = await tradingview_adapter.process_webhook(payload, secret)
        
        return {
            "status": "success",
            "signal": {
                "symbol": signal.symbol,
                "side": signal.side.value if signal.side else "close",
                "price": signal.price,
                "timestamp": signal.timestamp.isoformat()
            }
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_tradingview_status():
    """Get TradingView adapter status."""
    return tradingview_adapter.get_statistics()
