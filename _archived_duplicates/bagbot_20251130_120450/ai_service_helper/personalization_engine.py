"""Personalization Engine - Profile-aware suggestions."""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class PersonalizationEngine:
    """
    Provides personalized recommendations based on user profile.
    
    Considers:
    - Market preference (crypto/forex/stocks)
    - Strategy preference
    - Risk tolerance
    - Experience level
    """
    
    def __init__(self):
        logger.info("👤 Personalization Engine initialized")
    
    def get_strategy_recommendations(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend strategies based on user profile.
        
        Args:
            user_profile: User preferences and settings
            
        Returns:
            Recommended strategies with reasons
        """
        market_pref = user_profile.get("market_preference", "crypto")
        risk_tolerance = user_profile.get("risk_tolerance", "medium")  # low/medium/high
        experience = user_profile.get("experience_level", "intermediate")  # beginner/intermediate/advanced
        
        recommendations = []
        
        # Experience-based recommendations
        if experience == "beginner":
            recommendations.extend([
                {
                    "strategy": "Mean Reversion",
                    "reason": "Simple logic, clear entry/exit rules",
                    "priority": "high"
                },
                {
                    "strategy": "Trend Continuation",
                    "reason": "Follows established trends, lower complexity",
                    "priority": "medium"
                }
            ])
        elif experience == "intermediate":
            recommendations.extend([
                {
                    "strategy": "Order Blocks",
                    "reason": "Smart money concepts with good risk/reward",
                    "priority": "high"
                },
                {
                    "strategy": "FVG",
                    "reason": "Gap trading with clear setups",
                    "priority": "medium"
                }
            ])
        else:  # advanced
            recommendations.extend([
                {
                    "strategy": "Liquidity Sweeps",
                    "reason": "Advanced smart money tactics",
                    "priority": "high"
                },
                {
                    "strategy": "Micro Trend Follower",
                    "reason": "High-frequency, requires active monitoring",
                    "priority": "medium"
                }
            ])
        
        # Risk-based recommendations
        if risk_tolerance == "low":
            recommendations.append({
                "strategy": "Supply/Demand",
                "reason": "Zone trading with defined risk",
                "priority": "medium"
            })
        elif risk_tolerance == "high":
            recommendations.append({
                "strategy": "Volatility Breakouts",
                "reason": "Captures large moves in volatile markets",
                "priority": "high"
            })
        
        return {
            "recommendations": recommendations,
            "profile": {
                "market": market_pref,
                "risk": risk_tolerance,
                "experience": experience
            },
            "note": "Start with 1-2 strategies and expand as you gain confidence."
        }
    
    def get_risk_settings_recommendation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend risk settings based on profile."""
        risk_tolerance = user_profile.get("risk_tolerance", "medium")
        capital = user_profile.get("capital", 1000)
        
        if risk_tolerance == "low":
            return {
                "max_risk_per_trade": 0.005,  # 0.5%
                "max_position_size": 0.01,     # 1%
                "max_daily_loss": 0.02,        # 2%
                "reasoning": "Conservative settings for capital preservation"
            }
        elif risk_tolerance == "medium":
            return {
                "max_risk_per_trade": 0.01,   # 1%
                "max_position_size": 0.02,     # 2%
                "max_daily_loss": 0.05,        # 5%
                "reasoning": "Balanced risk/reward approach"
            }
        else:  # high
            return {
                "max_risk_per_trade": 0.02,   # 2%
                "max_position_size": 0.05,     # 5%
                "max_daily_loss": 0.10,        # 10%
                "reasoning": "Aggressive settings for growth (higher risk)"
            }
    
    def get_market_recommendations(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend markets based on profile."""
        experience = user_profile.get("experience_level", "intermediate")
        capital = user_profile.get("capital", 1000)
        
        recommendations = []
        
        if capital < 500:
            recommendations.append({
                "market": "Crypto",
                "reason": "Low minimum order sizes, 24/7 trading",
                "exchanges": ["Binance", "Bybit"]
            })
        
        if experience in ["intermediate", "advanced"]:
            recommendations.append({
                "market": "Forex",
                "reason": "High liquidity, low spreads",
                "exchanges": ["Oanda", "MT5"]
            })
        
        if capital > 5000 and experience == "advanced":
            recommendations.append({
                "market": "Stocks",
                "reason": "Regulated, diverse opportunities",
                "exchanges": ["Alpaca"]
            })
        
        return {
            "recommendations": recommendations,
            "note": "Start with one market to build experience."
        }
