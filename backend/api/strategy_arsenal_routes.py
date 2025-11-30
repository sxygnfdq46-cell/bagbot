"""API routes for Strategy Arsenal."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/strategies", tags=["Strategy Arsenal"])


# Pydantic models
class StrategyConfig(BaseModel):
    enabled: bool
    parameters: Dict[str, Any]


class StrategyPerformance(BaseModel):
    win_rate: float
    total_trades: int
    profit_loss: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None


# Mock data for now - will connect to real Strategy Arsenal
STRATEGIES = {
    "order_blocks": {
        "name": "Order Blocks",
        "description": "Institutional accumulation zones (>70% body candles)",
        "enabled": True,
        "difficulty": "Intermediate",
        "best_conditions": "Trending markets with clear institutional activity",
        "parameters": {
            "min_body_pct": 0.7,
            "lookback_candles": 20,
            "confirmation_required": True
        },
        "performance": {
            "win_rate": 0.68,
            "total_trades": 145,
            "profit_loss": 12580.50,
            "sharpe_ratio": 2.1,
            "max_drawdown": 0.15
        }
    },
    "fvg": {
        "name": "Fair Value Gap",
        "description": "3-candle gaps (c1.high < c3.low), 2x gap size targets",
        "enabled": True,
        "difficulty": "Advanced",
        "best_conditions": "High volatility with clear directional moves",
        "parameters": {
            "min_gap_size": 0.001,
            "target_multiplier": 2.0,
            "stop_loss_multiplier": 1.0
        },
        "performance": {
            "win_rate": 0.72,
            "total_trades": 98,
            "profit_loss": 15240.30,
            "sharpe_ratio": 2.5,
            "max_drawdown": 0.12
        }
    },
    "liquidity_sweeps": {
        "name": "Liquidity Sweeps",
        "description": "Wick beyond swing levels, close inside range",
        "enabled": False,
        "difficulty": "Advanced",
        "best_conditions": "Range-bound markets with false breakouts",
        "parameters": {
            "swing_lookback": 50,
            "wick_threshold": 0.002,
            "reversal_confirmation": True
        },
        "performance": {
            "win_rate": 0.75,
            "total_trades": 67,
            "profit_loss": 9870.20,
            "sharpe_ratio": 2.8,
            "max_drawdown": 0.10
        }
    },
    "breaker_blocks": {
        "name": "Breaker Blocks",
        "description": "Failed breakouts become reversal zones",
        "enabled": False,
        "difficulty": "Intermediate",
        "best_conditions": "Markets with failed breakout attempts",
        "parameters": {
            "breakout_threshold": 0.005,
            "reversal_candles": 3,
            "volume_confirmation": True
        },
        "performance": {
            "win_rate": 0.65,
            "total_trades": 89,
            "profit_loss": 7650.80,
            "sharpe_ratio": 1.9,
            "max_drawdown": 0.18
        }
    },
    "mean_reversion": {
        "name": "Mean Reversion",
        "description": "2 std dev from mean, range trading",
        "enabled": True,
        "difficulty": "Beginner",
        "best_conditions": "Range-bound, low volatility markets",
        "parameters": {
            "std_dev_threshold": 2.0,
            "lookback_period": 20,
            "exit_at_mean": True
        },
        "performance": {
            "win_rate": 0.62,
            "total_trades": 203,
            "profit_loss": 8920.40,
            "sharpe_ratio": 1.7,
            "max_drawdown": 0.14
        }
    },
    "trend_continuation": {
        "name": "Trend Continuation",
        "description": "38.2% Fibonacci pullbacks in 5%+ trends",
        "enabled": True,
        "difficulty": "Beginner",
        "best_conditions": "Strong trending markets",
        "parameters": {
            "min_trend_strength": 0.05,
            "fib_level": 0.382,
            "confirmation_candles": 2
        },
        "performance": {
            "win_rate": 0.70,
            "total_trades": 156,
            "profit_loss": 14320.60,
            "sharpe_ratio": 2.2,
            "max_drawdown": 0.13
        }
    },
    "volatility_breakouts": {
        "name": "Volatility Breakouts",
        "description": "Price beyond prev high/low + 2*ATR",
        "enabled": False,
        "difficulty": "Intermediate",
        "best_conditions": "High volatility expansion phases",
        "parameters": {
            "atr_multiplier": 2.0,
            "lookback_period": 14,
            "volume_filter": True
        },
        "performance": {
            "win_rate": 0.64,
            "total_trades": 112,
            "profit_loss": 10450.30,
            "sharpe_ratio": 2.0,
            "max_drawdown": 0.16
        }
    },
    "supply_demand": {
        "name": "Supply/Demand Zones",
        "description": "Consolidation zones, institutional accumulation",
        "enabled": False,
        "difficulty": "Intermediate",
        "best_conditions": "Markets with clear institutional zones",
        "parameters": {
            "zone_lookback": 100,
            "min_touches": 2,
            "zone_strength_filter": True
        },
        "performance": {
            "win_rate": 0.69,
            "total_trades": 78,
            "profit_loss": 11230.50,
            "sharpe_ratio": 2.3,
            "max_drawdown": 0.11
        }
    },
    "micro_trend_follower": {
        "name": "Micro Trend Follower",
        "description": "Ultra-fast tick-based, constant alignment",
        "enabled": False,
        "difficulty": "Advanced",
        "best_conditions": "Liquid markets, high-frequency trading",
        "parameters": {
            "tick_lookback": 100,
            "alignment_threshold": 0.75,
            "exit_on_misalignment": True
        },
        "performance": {
            "win_rate": 0.58,
            "total_trades": 1247,
            "profit_loss": 18940.70,
            "sharpe_ratio": 1.8,
            "max_drawdown": 0.20
        }
    }
}


@router.get("/")
async def list_strategies():
    """List all available strategies."""
    return {
        "strategies": [
            {
                "id": key,
                "name": val["name"],
                "description": val["description"],
                "enabled": val["enabled"],
                "difficulty": val["difficulty"],
                "win_rate": val["performance"]["win_rate"]
            }
            for key, val in STRATEGIES.items()
        ]
    }


@router.get("/{strategy_id}")
async def get_strategy(strategy_id: str):
    """Get detailed strategy information."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return STRATEGIES[strategy_id]


@router.post("/{strategy_id}/enable")
async def enable_strategy(strategy_id: str):
    """Enable a strategy."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    STRATEGIES[strategy_id]["enabled"] = True
    logger.info(f"Strategy {strategy_id} enabled")
    
    return {"status": "success", "message": f"Strategy {strategy_id} enabled"}


@router.post("/{strategy_id}/disable")
async def disable_strategy(strategy_id: str):
    """Disable a strategy."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    STRATEGIES[strategy_id]["enabled"] = False
    logger.info(f"Strategy {strategy_id} disabled")
    
    return {"status": "success", "message": f"Strategy {strategy_id} disabled"}


@router.put("/{strategy_id}/config")
async def update_strategy_config(strategy_id: str, config: StrategyConfig):
    """Update strategy configuration."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    STRATEGIES[strategy_id]["enabled"] = config.enabled
    STRATEGIES[strategy_id]["parameters"].update(config.parameters)
    
    logger.info(f"Strategy {strategy_id} configuration updated")
    
    return {"status": "success", "strategy": STRATEGIES[strategy_id]}


@router.get("/{strategy_id}/performance")
async def get_strategy_performance(strategy_id: str):
    """Get strategy performance metrics."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return STRATEGIES[strategy_id]["performance"]


@router.get("/{strategy_id}/suitability")
async def get_strategy_suitability(strategy_id: str):
    """Get current market suitability for strategy."""
    if strategy_id not in STRATEGIES:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # TODO: Connect to News Anchor for real market context
    # For now, return mock suitability
    return {
        "strategy": strategy_id,
        "suitability_score": 0.75,
        "assessment": "Favorable",
        "reasons": [
            "Market volatility within acceptable range",
            "Trending conditions detected",
            "Risk level moderate"
        ],
        "cautions": []
    }
