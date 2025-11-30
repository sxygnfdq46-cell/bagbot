"""
Strategy Switching Logic - Intelligent strategy selection.

Switches strategies based on:
- Market volatility
- Win/loss streak
- Time of day
- Spread levels
- Strategy confidence scores
- News filter status
- Market router signals
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, time
from enum import Enum

logger = logging.getLogger(__name__)


class MarketCondition(Enum):
    """Market condition types."""
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    TRENDING = "trending"
    RANGING = "ranging"
    NEWS_EVENT = "news_event"
    NORMAL = "normal"


class StrategyRecommendation:
    """Strategy recommendation with reasoning."""
    
    def __init__(
        self,
        strategy_name: str,
        confidence: float,
        reason: str,
        conditions: List[str]
    ):
        """
        Initialize recommendation.
        
        Args:
            strategy_name: Recommended strategy name
            confidence: Confidence in recommendation (0.0 to 1.0)
            reason: Human-readable reason
            conditions: List of conditions that led to this recommendation
        """
        self.strategy_name = strategy_name
        self.confidence = confidence
        self.reason = reason
        self.conditions = conditions


class StrategySwitcher:
    """
    Intelligent strategy switching coordinator.
    
    Analyzes market conditions and performance to recommend
    the optimal strategy for current conditions.
    
    Integrates with:
    - Mindset Engine (emotional state)
    - Risk Engine (risk levels)
    - News Filter (event detection)
    - Streak Manager (performance tracking)
    - Market Router (market conditions)
    """
    
    def __init__(self):
        """Initialize strategy switcher."""
        self.current_strategy: Optional[str] = None
        self.last_switch_time: Optional[datetime] = None
        self.switch_cooldown_minutes = 15  # Minimum time between switches
        
        # Strategy profiles
        self.strategy_profiles = {
            "micro_trend_follower": {
                "best_conditions": ["low_volatility", "trending"],
                "worst_conditions": ["high_volatility", "news_event"],
                "time_preference": "none",
                "min_spread": 0.0,
                "max_spread": 2.0,
                "min_confidence": 0.6
            },
            "mean_reversion": {
                "best_conditions": ["ranging", "low_volatility"],
                "worst_conditions": ["trending", "high_volatility"],
                "time_preference": "asian_session",
                "min_spread": 0.0,
                "max_spread": 1.5,
                "min_confidence": 0.5
            },
            "conservative_scalper": {
                "best_conditions": ["normal", "ranging"],
                "worst_conditions": ["high_volatility", "news_event"],
                "time_preference": "none",
                "min_spread": 0.0,
                "max_spread": 1.0,
                "min_confidence": 0.4
            },
            "breakout_trader": {
                "best_conditions": ["high_volatility", "trending"],
                "worst_conditions": ["ranging", "low_volatility"],
                "time_preference": "london_newyork_overlap",
                "min_spread": 0.0,
                "max_spread": 3.0,
                "min_confidence": 0.7
            }
        }
        
        logger.info("🔄 StrategySwitcher initialized")
    
    def get_recommendation(
        self,
        market_conditions: Dict[str, Any],
        streak_manager_status: Dict[str, Any],
        news_filter_status: Dict[str, Any],
        mindset_state: str,
        current_spread: float
    ) -> StrategyRecommendation:
        """
        Get strategy recommendation based on current conditions.
        
        Args:
            market_conditions: Market state from router
            streak_manager_status: Performance metrics
            news_filter_status: News filter state
            mindset_state: Current emotional state
            current_spread: Current spread in pips
            
        Returns:
            Strategy recommendation
        """
        conditions = []
        scores = {}
        
        # Detect market condition
        market_condition = self._detect_market_condition(
            market_conditions,
            news_filter_status
        )
        conditions.append(market_condition.value)
        
        # Get current time context
        time_context = self._get_time_context()
        conditions.append(f"time:{time_context}")
        
        # Check if we're in cooldown
        if self._in_cooldown():
            logger.debug("⏳ Strategy switch cooldown active")
            if self.current_strategy:
                return StrategyRecommendation(
                    strategy_name=self.current_strategy,
                    confidence=0.5,
                    reason="Cooldown period active",
                    conditions=conditions
                )
        
        # Score each strategy
        for strategy_name, profile in self.strategy_profiles.items():
            score = self._score_strategy(
                strategy_name=strategy_name,
                profile=profile,
                market_condition=market_condition,
                streak_status=streak_manager_status,
                mindset_state=mindset_state,
                current_spread=current_spread,
                time_context=time_context
            )
            
            scores[strategy_name] = score
        
        # Find best strategy
        best_strategy = max(scores, key=scores.get)
        best_score = scores[best_strategy]
        
        # Build reason
        reason = self._build_recommendation_reason(
            strategy_name=best_strategy,
            score=best_score,
            market_condition=market_condition,
            streak_status=streak_manager_status,
            mindset_state=mindset_state
        )
        
        logger.info(
            f"🎯 Recommended: {best_strategy} "
            f"(confidence: {best_score:.2f})"
        )
        
        return StrategyRecommendation(
            strategy_name=best_strategy,
            confidence=best_score,
            reason=reason,
            conditions=conditions
        )
    
    def switch_strategy(
        self,
        new_strategy: str,
        reason: str
    ) -> bool:
        """
        Switch to a new strategy.
        
        Args:
            new_strategy: Strategy name to switch to
            reason: Reason for switch
            
        Returns:
            True if switched successfully
        """
        if new_strategy not in self.strategy_profiles:
            logger.error(f"Unknown strategy: {new_strategy}")
            return False
        
        if self._in_cooldown():
            logger.warning(
                "Cannot switch: cooldown active "
                f"({self._cooldown_remaining():.1f} minutes remaining)"
            )
            return False
        
        old_strategy = self.current_strategy
        self.current_strategy = new_strategy
        self.last_switch_time = datetime.now()
        
        logger.info(
            f"🔄 Strategy switched: {old_strategy} → {new_strategy} "
            f"({reason})"
        )
        
        return True
    
    def force_switch(self, new_strategy: str, reason: str) -> bool:
        """
        Force strategy switch (admin override).
        
        Args:
            new_strategy: Strategy name
            reason: Reason for forced switch
            
        Returns:
            True if switched
        """
        if new_strategy not in self.strategy_profiles:
            logger.error(f"Unknown strategy: {new_strategy}")
            return False
        
        old_strategy = self.current_strategy
        self.current_strategy = new_strategy
        self.last_switch_time = datetime.now()
        
        logger.warning(
            f"⚠️  FORCED strategy switch: {old_strategy} → {new_strategy} "
            f"({reason})"
        )
        
        return True
    
    def _detect_market_condition(
        self,
        market_conditions: Dict[str, Any],
        news_filter_status: Dict[str, Any]
    ) -> MarketCondition:
        """
        Detect current market condition.
        
        Args:
            market_conditions: Market state
            news_filter_status: News filter state
            
        Returns:
            Market condition
        """
        # Check for news events first
        if news_filter_status.get("active_events_count", 0) > 0:
            return MarketCondition.NEWS_EVENT
        
        # Check volatility
        volatility = market_conditions.get("volatility", 0.5)
        
        if volatility > 0.7:
            return MarketCondition.HIGH_VOLATILITY
        elif volatility < 0.3:
            return MarketCondition.LOW_VOLATILITY
        
        # Check trend strength
        trend_strength = market_conditions.get("trend_strength", 0.5)
        
        if trend_strength > 0.6:
            return MarketCondition.TRENDING
        elif trend_strength < 0.4:
            return MarketCondition.RANGING
        
        return MarketCondition.NORMAL
    
    def _get_time_context(self) -> str:
        """
        Get current time context.
        
        Returns:
            Time context string
        """
        now = datetime.now().time()
        
        # Trading sessions (UTC)
        asian_start = time(0, 0)
        asian_end = time(9, 0)
        london_start = time(8, 0)
        london_end = time(16, 0)
        newyork_start = time(13, 0)
        newyork_end = time(22, 0)
        
        # Check overlaps
        if london_start <= now <= newyork_start:
            return "london_session"
        elif newyork_start <= now <= min(london_end, newyork_end):
            return "london_newyork_overlap"
        elif newyork_start <= now <= newyork_end:
            return "newyork_session"
        elif asian_start <= now <= asian_end:
            return "asian_session"
        else:
            return "off_hours"
    
    def _score_strategy(
        self,
        strategy_name: str,
        profile: Dict[str, Any],
        market_condition: MarketCondition,
        streak_status: Dict[str, Any],
        mindset_state: str,
        current_spread: float,
        time_context: str
    ) -> float:
        """
        Score a strategy for current conditions.
        
        Args:
            strategy_name: Strategy name
            profile: Strategy profile
            market_condition: Current market condition
            streak_status: Streak manager status
            mindset_state: Mindset engine state
            current_spread: Current spread
            time_context: Current time context
            
        Returns:
            Score (0.0 to 1.0)
        """
        score = 0.5  # Base score
        
        # Market condition match (±0.3)
        if market_condition.value in profile["best_conditions"]:
            score += 0.3
        elif market_condition.value in profile["worst_conditions"]:
            score -= 0.3
        
        # Time preference match (±0.1)
        if profile["time_preference"] != "none":
            if profile["time_preference"] == time_context:
                score += 0.1
            else:
                score -= 0.05
        
        # Spread check (±0.1)
        if profile["min_spread"] <= current_spread <= profile["max_spread"]:
            score += 0.1
        else:
            score -= 0.2
        
        # Streak performance (±0.2)
        confidence = streak_status.get("confidence_score", 0.5)
        if confidence >= profile["min_confidence"]:
            score += (confidence - 0.5) * 0.4
        else:
            score -= 0.2
        
        # Mindset state alignment (±0.1)
        if mindset_state in ["calm", "confident"]:
            score += 0.1
        elif mindset_state in ["defensive", "locked"]:
            score -= 0.1
            # Conservative scalper gets bonus during defensive states
            if strategy_name == "conservative_scalper":
                score += 0.15
        
        # Losing streak penalty
        if streak_status.get("locked", False):
            if strategy_name != "conservative_scalper":
                score -= 0.3
        
        # Clamp to [0, 1]
        return max(0.0, min(1.0, score))
    
    def _build_recommendation_reason(
        self,
        strategy_name: str,
        score: float,
        market_condition: MarketCondition,
        streak_status: Dict[str, Any],
        mindset_state: str
    ) -> str:
        """
        Build human-readable recommendation reason.
        
        Args:
            strategy_name: Recommended strategy
            score: Confidence score
            market_condition: Market condition
            streak_status: Streak status
            mindset_state: Mindset state
            
        Returns:
            Reason string
        """
        reasons = []
        
        # Market condition
        reasons.append(f"Market: {market_condition.value}")
        
        # Performance
        win_rate = streak_status.get("metrics", {}).get("win_rate", 0)
        if win_rate > 0:
            reasons.append(f"Win rate: {win_rate:.1%}")
        
        # Mindset
        reasons.append(f"Mindset: {mindset_state}")
        
        # Streak
        streak = streak_status.get("metrics", {}).get("current_streak", 0)
        if streak != 0:
            streak_type = "wins" if streak > 0 else "losses"
            reasons.append(f"Streak: {abs(streak)} {streak_type}")
        
        return f"{strategy_name} (conf: {score:.1%}) - " + ", ".join(reasons)
    
    def _in_cooldown(self) -> bool:
        """
        Check if in cooldown period.
        
        Returns:
            True if in cooldown
        """
        if not self.last_switch_time:
            return False
        
        elapsed = (datetime.now() - self.last_switch_time).total_seconds() / 60
        return elapsed < self.switch_cooldown_minutes
    
    def _cooldown_remaining(self) -> float:
        """
        Get remaining cooldown time in minutes.
        
        Returns:
            Minutes remaining
        """
        if not self._in_cooldown():
            return 0.0
        
        elapsed = (datetime.now() - self.last_switch_time).total_seconds() / 60
        return self.switch_cooldown_minutes - elapsed
    
    def get_status(self) -> Dict[str, Any]:
        """Get switcher status."""
        return {
            "current_strategy": self.current_strategy,
            "last_switch_time": self.last_switch_time.isoformat() if self.last_switch_time else None,
            "in_cooldown": self._in_cooldown(),
            "cooldown_remaining_minutes": self._cooldown_remaining(),
            "available_strategies": list(self.strategy_profiles.keys())
        }
