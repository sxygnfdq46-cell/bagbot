"""API routes for Risk Engine."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/risk", tags=["Risk Engine"])


# Pydantic models
class RiskLimits(BaseModel):
    max_risk_per_trade: float
    max_position_size: float
    max_daily_loss: float
    max_open_positions: int
    max_correlation: float


# Mock current state
CURRENT_RISK_STATE = {
    "total_exposure": 0.15,  # 15% of account
    "daily_loss": 0.02,  # 2% loss today
    "open_positions": 3,
    "largest_position": 0.08,
    "correlation_risk": 0.45,
    "var_95": 0.025,  # 2.5% Value at Risk (95% confidence)
    "circuit_breaker_active": False
}

RISK_LIMITS = {
    "max_risk_per_trade": 0.02,  # 2% per trade
    "max_position_size": 0.10,  # 10% max position
    "max_daily_loss": 0.05,  # 5% daily loss limit
    "max_open_positions": 5,
    "max_correlation": 0.70  # Max 70% correlation between positions
}


@router.get("/metrics")
async def get_risk_metrics():
    """Get current risk metrics."""
    return {
        "timestamp": datetime.now().isoformat(),
        "metrics": CURRENT_RISK_STATE,
        "limits": RISK_LIMITS,
        "health_score": _calculate_health_score(),
        "warnings": _get_risk_warnings()
    }


@router.get("/limits")
async def get_risk_limits():
    """Get configured risk limits."""
    return RISK_LIMITS


@router.put("/limits")
async def update_risk_limits(limits: RiskLimits):
    """Update risk limits."""
    RISK_LIMITS.update(limits.dict())
    logger.info(f"Risk limits updated: {limits.dict()}")
    
    return {
        "status": "success",
        "limits": RISK_LIMITS
    }


@router.get("/exposure")
async def get_current_exposure():
    """Get detailed exposure breakdown."""
    return {
        "total_exposure_pct": CURRENT_RISK_STATE["total_exposure"],
        "by_market": {
            "crypto": 0.10,
            "forex": 0.05,
            "stocks": 0.00
        },
        "by_strategy": {
            "order_blocks": 0.08,
            "mean_reversion": 0.05,
            "trend_continuation": 0.02
        },
        "largest_position": {
            "symbol": "BTCUSDT",
            "exposure_pct": CURRENT_RISK_STATE["largest_position"],
            "direction": "LONG"
        }
    }


@router.get("/history")
async def get_risk_history(days: int = 7):
    """Get historical risk metrics."""
    history = []
    base_date = datetime.now()
    
    for i in range(days):
        date = base_date - timedelta(days=i)
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "total_exposure": round(random.uniform(0.05, 0.25), 3),
            "daily_loss": round(random.uniform(-0.05, 0.02), 3),
            "open_positions": random.randint(1, 5),
            "var_95": round(random.uniform(0.015, 0.035), 3),
            "health_score": round(random.uniform(0.70, 0.95), 2)
        })
    
    return {
        "history": list(reversed(history)),
        "period_days": days
    }


@router.get("/circuit-breaker")
async def get_circuit_breaker_status():
    """Get circuit breaker status."""
    return {
        "active": CURRENT_RISK_STATE["circuit_breaker_active"],
        "triggered_at": None,
        "reason": None,
        "auto_reset_time": None,
        "can_override": True
    }


@router.post("/circuit-breaker/reset")
async def reset_circuit_breaker():
    """Reset circuit breaker."""
    CURRENT_RISK_STATE["circuit_breaker_active"] = False
    logger.info("Circuit breaker reset")
    
    return {
        "status": "success",
        "message": "Circuit breaker reset"
    }


@router.get("/violations")
async def get_recent_violations():
    """Get recent risk limit violations."""
    # Mock violations
    return {
        "violations": [
            {
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "type": "max_correlation",
                "severity": "warning",
                "message": "Correlation between BTC and ETH exceeded 70%",
                "action_taken": "Rejected new BTC position"
            },
            {
                "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
                "type": "max_position_size",
                "severity": "warning",
                "message": "Position size 12% exceeded limit of 10%",
                "action_taken": "Reduced position to 10%"
            }
        ]
    }


def _calculate_health_score() -> float:
    """Calculate overall risk health score (0-1)."""
    score = 1.0
    
    # Penalize high exposure
    if CURRENT_RISK_STATE["total_exposure"] > 0.20:
        score -= 0.15
    
    # Penalize daily losses
    if CURRENT_RISK_STATE["daily_loss"] < -0.03:
        score -= 0.20
    
    # Penalize high correlation
    if CURRENT_RISK_STATE["correlation_risk"] > 0.60:
        score -= 0.10
    
    # Penalize circuit breaker active
    if CURRENT_RISK_STATE["circuit_breaker_active"]:
        score -= 0.30
    
    return max(0.0, score)


def _get_risk_warnings() -> List[str]:
    """Get active risk warnings."""
    warnings = []
    
    if CURRENT_RISK_STATE["total_exposure"] > 0.20:
        warnings.append("High exposure: 15% of account at risk")
    
    if CURRENT_RISK_STATE["daily_loss"] < -0.03:
        warnings.append("Daily loss approaching limit (-2% / -5% max)")
    
    if CURRENT_RISK_STATE["correlation_risk"] > 0.60:
        warnings.append("High correlation between positions (45%)")
    
    if CURRENT_RISK_STATE["circuit_breaker_active"]:
        warnings.append("CIRCUIT BREAKER ACTIVE - Trading suspended")
    
    return warnings
