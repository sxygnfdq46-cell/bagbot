"""Market data endpoints for frontend."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/market", tags=["market"])

@router.get("/prices")
async def get_prices():
    """Get current market prices."""
    return {
        "BTCUSDT": {"price": 43750.12},
        "ETHUSDT": {"price": 2380.55},
    }

@router.get("/summary")
async def get_market_summary():
    """Get market summary."""
    return {
        "total_volume": 1234567890,
        "trending": "BULLISH",
        "volatility": "MEDIUM"
    }

@router.get("/volatility")
async def get_volatility():
    """Get market volatility metrics."""
    return {
        "btc_volatility": 0.35,
        "eth_volatility": 0.42,
        "market_volatility": 0.38
    }

@router.get("/liquidity")
async def get_liquidity():
    """Get market liquidity metrics."""
    return {
        "btc_liquidity": "HIGH",
        "eth_liquidity": "HIGH",
        "overall": "HEALTHY"
    }
