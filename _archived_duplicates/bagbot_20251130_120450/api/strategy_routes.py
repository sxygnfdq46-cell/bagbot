"""Strategy API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json

router = APIRouter(prefix="/api/strategy", tags=["strategy"])


class StrategyConfig(BaseModel):
    """Model for strategy configuration."""
    strategy: str = Field(..., description="Strategy name")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Strategy parameters")


class StrategyInfo(BaseModel):
    """Model for strategy information."""
    name: str
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)


# In-memory storage for active strategy config
_active_strategy = {
    "strategy": "ai_fusion",
    "parameters": {
        "sma_short": 10,
        "sma_long": 30,
        "ema_short": 12,
        "ema_long": 26,
        "rsi_period": 14,
        "rsi_buy_threshold": 30.0,
        "rsi_sell_threshold": 70.0,
        "macd_fast": 12,
        "macd_slow": 26,
        "macd_signal": 9,
        "atr_period": 14,
        "risk_per_trade_pct": 1.0,
        "max_position_pct": 5.0,
        "volatility_threshold": 0.5,
        "trailing_stop_atr_mul": 2.0
    }
}


@router.get("/list")
async def list_strategies():
    """
    List all available strategies.
    
    Returns:
        List of strategy names from the registry
    """
    # Import strategy registry
    from bagbot.worker.strategies.registry import STRATEGY_REGISTRY
    
    strategies = []
    
    for name, strategy_class in STRATEGY_REGISTRY.items():
        strategies.append({
            "name": name,
            "description": f"{name.replace('_', ' ').title()} Strategy",
            "available": True
        })
    
    return {
        "strategies": list(STRATEGY_REGISTRY.keys()),
        "details": strategies,
        "total": len(STRATEGY_REGISTRY)
    }


@router.get("/config")
async def get_strategy_config():
    """
    Get current active strategy configuration.
    
    Returns:
        Active strategy name and parameters
    """
    return {
        "active_strategy": _active_strategy["strategy"],
        "parameters": _active_strategy["parameters"]
    }


@router.put("/config")
async def update_strategy_config(config: StrategyConfig):
    """
    Update strategy configuration.
    
    Args:
        config: New strategy configuration
        
    Returns:
        Confirmation of update
    """
    # Validate strategy exists
    from bagbot.worker.strategies.registry import STRATEGY_REGISTRY
    
    if config.strategy not in STRATEGY_REGISTRY:
        available = list(STRATEGY_REGISTRY.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Strategy '{config.strategy}' not found. Available strategies: {', '.join(available)}"
        )
    
    # Update active strategy
    _active_strategy["strategy"] = config.strategy
    _active_strategy["parameters"].update(config.parameters)
    
    return {
        "status": "updated",
        "message": f"Strategy configuration updated to '{config.strategy}'",
        "active_strategy": _active_strategy["strategy"],
        "parameters": _active_strategy["parameters"]
    }


@router.post("/activate")
async def activate_strategy(strategy_name: str):
    """
    Activate a specific strategy.
    
    Args:
        strategy_name: Name of strategy to activate
        
    Returns:
        Confirmation of activation
    """
    # Validate strategy exists
    from bagbot.worker.strategies.registry import STRATEGY_REGISTRY
    
    if strategy_name not in STRATEGY_REGISTRY:
        available = list(STRATEGY_REGISTRY.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Strategy '{strategy_name}' not found. Available strategies: {', '.join(available)}"
        )
    
    # Activate strategy
    _active_strategy["strategy"] = strategy_name
    
    return {
        "status": "activated",
        "message": f"Strategy '{strategy_name}' activated",
        "active_strategy": strategy_name
    }


@router.get("/parameters/{strategy_name}")
async def get_strategy_parameters(strategy_name: str):
    """
    Get default parameters for a specific strategy.
    
    Args:
        strategy_name: Name of the strategy
        
    Returns:
        Strategy parameter schema
    """
    from bagbot.worker.strategies.registry import STRATEGY_REGISTRY
    
    if strategy_name not in STRATEGY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Strategy '{strategy_name}' not found"
        )
    
    # Return default parameters based on strategy
    if strategy_name == "ai_fusion":
        return {
            "strategy": strategy_name,
            "parameters": {
                "sma_short": {"default": 10, "min": 5, "max": 20, "type": "int"},
                "sma_long": {"default": 30, "min": 21, "max": 60, "type": "int"},
                "ema_short": {"default": 12, "min": 5, "max": 20, "type": "int"},
                "ema_long": {"default": 26, "min": 21, "max": 60, "type": "int"},
                "rsi_period": {"default": 14, "min": 7, "max": 21, "type": "int"},
                "rsi_buy_threshold": {"default": 30.0, "min": 20.0, "max": 40.0, "type": "float"},
                "rsi_sell_threshold": {"default": 70.0, "min": 60.0, "max": 80.0, "type": "float"},
                "macd_fast": {"default": 12, "min": 8, "max": 16, "type": "int"},
                "macd_slow": {"default": 26, "min": 18, "max": 36, "type": "int"},
                "macd_signal": {"default": 9, "min": 5, "max": 12, "type": "int"},
                "atr_period": {"default": 14, "min": 7, "max": 21, "type": "int"},
                "risk_per_trade_pct": {"default": 1.0, "min": 0.25, "max": 5.0, "type": "float"},
                "max_position_pct": {"default": 5.0, "min": 1.0, "max": 20.0, "type": "float"},
                "volatility_threshold": {"default": 0.5, "min": 0.1, "max": 2.0, "type": "float"},
                "trailing_stop_atr_mul": {"default": 2.0, "min": 1.0, "max": 5.0, "type": "float"}
            }
        }
    else:
        return {
            "strategy": strategy_name,
            "parameters": {}
        }


@router.get("/info/{strategy_name}")
async def get_strategy_info(strategy_name: str):
    """
    Get detailed information about a strategy.
    
    Args:
        strategy_name: Name of the strategy
        
    Returns:
        Strategy details and documentation
    """
    from bagbot.worker.strategies.registry import STRATEGY_REGISTRY
    
    if strategy_name not in STRATEGY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Strategy '{strategy_name}' not found"
        )
    
    descriptions = {
        "ai_fusion": "Advanced multi-indicator fusion strategy combining SMA, EMA, RSI, MACD, and ATR for comprehensive market analysis.",
        "example": "Simple example strategy for testing and demonstration purposes."
    }
    
    return {
        "name": strategy_name,
        "description": descriptions.get(strategy_name, "No description available"),
        "active": _active_strategy["strategy"] == strategy_name,
        "available": True
    }
