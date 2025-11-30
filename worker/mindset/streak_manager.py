"""
Streak Manager - Performance Awareness System

Tracks win/loss streaks and automatically adjusts risk based on performance.

Rules:
- After 3 losses → Reduce position size by 50%
- After 5 losses → Trading pause (admin override needed)
- After 5 wins → Auto-increase risk (capped at +20%)
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


class StreakState(Enum):
    """Streak states."""
    NORMAL = "normal"
    HOT_STREAK = "hot_streak"  # 3+ wins
    COLD_STREAK = "cold_streak"  # 3+ losses
    LOCKED = "locked"  # 5+ losses, needs admin override


@dataclass
class PerformanceMetrics:
    """Performance tracking metrics."""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    current_streak: int = 0  # Positive = wins, negative = losses
    max_win_streak: int = 0
    max_loss_streak: int = 0
    total_pnl: float = 0.0
    average_win: float = 0.0
    average_loss: float = 0.0
    
    def win_rate(self) -> float:
        """Calculate win rate."""
        if self.total_trades == 0:
            return 0.0
        return self.winning_trades / self.total_trades
    
    def profit_factor(self) -> float:
        """Calculate profit factor."""
        total_wins = self.winning_trades * self.average_win
        total_losses = abs(self.losing_trades * self.average_loss)
        
        if total_losses == 0:
            return float('inf') if total_wins > 0 else 0.0
        
        return total_wins / total_losses


class StreakManager:
    """
    Performance awareness system.
    
    Integrates with:
    - Risk Engine (position size adjustment)
    - Mindset Engine (emotional state sync)
    - Strategy Arsenal (strategy switching signals)
    """
    
    def __init__(self, state_file: str = "data/state/streak_state.json"):
        """
        Initialize streak manager.
        
        Args:
            state_file: Path to state persistence file
        """
        self.state_file = state_file
        self.metrics = PerformanceMetrics()
        self.state = StreakState.NORMAL
        
        # Streak thresholds
        self.hot_streak_threshold = 5
        self.cold_streak_threshold = 3
        self.lock_threshold = 5
        
        # Risk multipliers
        self.normal_multiplier = 1.0
        self.hot_streak_multiplier = 1.2  # +20% max
        self.cold_streak_multiplier = 0.5  # -50%
        self.locked_multiplier = 0.0  # No trading
        
        # Admin override
        self.admin_override = False
        self.override_reason = ""
        
        # Strategy health tracking
        self.strategy_performance: Dict[str, PerformanceMetrics] = {}
        
        # Load state
        self._load_state()
        
        logger.info("📊 StreakManager initialized")
    
    def record_trade(
        self,
        pnl: float,
        strategy_name: Optional[str] = None
    ) -> None:
        """
        Record trade result.
        
        Args:
            pnl: Profit/loss
            strategy_name: Name of strategy (for per-strategy tracking)
        """
        is_win = pnl > 0
        
        # Update global metrics
        self.metrics.total_trades += 1
        self.metrics.total_pnl += pnl
        
        if is_win:
            self.metrics.winning_trades += 1
            
            # Update average win
            old_avg = self.metrics.average_win
            old_count = self.metrics.winning_trades - 1
            self.metrics.average_win = (
                (old_avg * old_count + pnl) / self.metrics.winning_trades
            )
            
            # Update streak
            if self.metrics.current_streak >= 0:
                self.metrics.current_streak += 1
            else:
                self.metrics.current_streak = 1
            
            # Update max win streak
            if self.metrics.current_streak > self.metrics.max_win_streak:
                self.metrics.max_win_streak = self.metrics.current_streak
        else:
            self.metrics.losing_trades += 1
            
            # Update average loss
            old_avg = self.metrics.average_loss
            old_count = self.metrics.losing_trades - 1
            self.metrics.average_loss = (
                (old_avg * old_count + pnl) / self.metrics.losing_trades
            )
            
            # Update streak
            if self.metrics.current_streak <= 0:
                self.metrics.current_streak -= 1
            else:
                self.metrics.current_streak = -1
            
            # Update max loss streak
            if abs(self.metrics.current_streak) > self.metrics.max_loss_streak:
                self.metrics.max_loss_streak = abs(self.metrics.current_streak)
        
        # Update per-strategy metrics
        if strategy_name:
            self._update_strategy_metrics(strategy_name, pnl, is_win)
        
        # Update state
        self._update_state()
        
        # Log
        streak_type = "wins" if self.metrics.current_streak > 0 else "losses"
        logger.info(
            f"{'💰' if is_win else '❌'} Trade result: PnL ${pnl:.2f} | "
            f"Streak: {abs(self.metrics.current_streak)} {streak_type} | "
            f"State: {self.state.value}"
        )
        
        # Save state
        self._save_state()
    
    def get_risk_multiplier(self) -> float:
        """
        Get current risk multiplier based on streak.
        
        Returns:
            Risk multiplier (0.0 to 1.2)
        """
        # Check admin override
        if self.admin_override:
            logger.debug("⚠️  Admin override active")
            return self.normal_multiplier
        
        if self.state == StreakState.LOCKED:
            return self.locked_multiplier
        elif self.state == StreakState.HOT_STREAK:
            return self.hot_streak_multiplier
        elif self.state == StreakState.COLD_STREAK:
            return self.cold_streak_multiplier
        else:
            return self.normal_multiplier
    
    def get_confidence_score(self) -> float:
        """
        Get confidence score (0.0 to 1.0).
        
        Based on:
        - Win rate
        - Profit factor
        - Current streak
        - Recent performance
        
        Returns:
            Confidence score
        """
        if self.metrics.total_trades == 0:
            return 0.5  # Neutral
        
        # Win rate component (0-40%)
        win_rate_score = self.metrics.win_rate() * 0.4
        
        # Profit factor component (0-30%)
        pf = self.metrics.profit_factor()
        pf_score = min(1.0, pf / 2.0) * 0.3 if pf != float('inf') else 0.3
        
        # Streak component (0-30%)
        if self.metrics.current_streak > 0:
            streak_score = min(1.0, self.metrics.current_streak / 10.0) * 0.3
        else:
            streak_score = max(0.0, 1.0 - abs(self.metrics.current_streak) / 10.0) * 0.3
        
        return win_rate_score + pf_score + streak_score
    
    def is_locked(self) -> bool:
        """
        Check if trading is locked.
        
        Returns:
            True if locked
        """
        return self.state == StreakState.LOCKED and not self.admin_override
    
    def should_reduce_risk(self) -> bool:
        """
        Check if risk should be reduced.
        
        Returns:
            True if in cold streak
        """
        return self.state == StreakState.COLD_STREAK
    
    def should_increase_risk(self) -> bool:
        """
        Check if risk can be increased.
        
        Returns:
            True if in hot streak
        """
        return self.state == StreakState.HOT_STREAK
    
    def enable_admin_override(self, reason: str) -> None:
        """
        Enable admin override to unlock trading.
        
        Args:
            reason: Reason for override
        """
        self.admin_override = True
        self.override_reason = reason
        
        logger.warning(f"⚠️  Admin override enabled: {reason}")
        self._save_state()
    
    def disable_admin_override(self) -> None:
        """Disable admin override."""
        self.admin_override = False
        self.override_reason = ""
        
        logger.info("✅ Admin override disabled")
        self._save_state()
    
    def reset_streak(self) -> None:
        """Reset current streak (admin action)."""
        old_streak = self.metrics.current_streak
        self.metrics.current_streak = 0
        self._update_state()
        
        logger.info(f"🔄 Streak reset (was: {old_streak})")
        self._save_state()
    
    def get_strategy_health(self, strategy_name: str) -> Dict[str, Any]:
        """
        Get health metrics for a strategy.
        
        Args:
            strategy_name: Strategy name
            
        Returns:
            Health metrics
        """
        if strategy_name not in self.strategy_performance:
            return {
                "trades": 0,
                "win_rate": 0.0,
                "pnl": 0.0,
                "health_score": 0.5
            }
        
        metrics = self.strategy_performance[strategy_name]
        
        # Calculate health score
        if metrics.total_trades == 0:
            health_score = 0.5
        else:
            win_rate = metrics.win_rate()
            pnl_normalized = max(0.0, min(1.0, (metrics.total_pnl / 1000.0) + 0.5))
            health_score = (win_rate * 0.6) + (pnl_normalized * 0.4)
        
        return {
            "trades": metrics.total_trades,
            "win_rate": metrics.win_rate(),
            "pnl": metrics.total_pnl,
            "health_score": health_score,
            "current_streak": metrics.current_streak
        }
    
    def get_market_health(self) -> Dict[str, Any]:
        """
        Get overall market health assessment.
        
        Returns:
            Market health metrics
        """
        confidence = self.get_confidence_score()
        
        # Determine market state
        if confidence > 0.7:
            market_state = "healthy"
        elif confidence > 0.4:
            market_state = "neutral"
        else:
            market_state = "unhealthy"
        
        return {
            "confidence": confidence,
            "state": market_state,
            "streak_state": self.state.value,
            "risk_multiplier": self.get_risk_multiplier(),
            "locked": self.is_locked()
        }
    
    def _update_strategy_metrics(
        self,
        strategy_name: str,
        pnl: float,
        is_win: bool
    ) -> None:
        """
        Update per-strategy metrics.
        
        Args:
            strategy_name: Strategy name
            pnl: Profit/loss
            is_win: Whether trade was a win
        """
        if strategy_name not in self.strategy_performance:
            self.strategy_performance[strategy_name] = PerformanceMetrics()
        
        metrics = self.strategy_performance[strategy_name]
        metrics.total_trades += 1
        metrics.total_pnl += pnl
        
        if is_win:
            metrics.winning_trades += 1
            if metrics.current_streak >= 0:
                metrics.current_streak += 1
            else:
                metrics.current_streak = 1
        else:
            metrics.losing_trades += 1
            if metrics.current_streak <= 0:
                metrics.current_streak -= 1
            else:
                metrics.current_streak = -1
    
    def _update_state(self) -> None:
        """Update streak state based on current performance."""
        streak = self.metrics.current_streak
        
        # Check for lock condition (5+ losses)
        if streak <= -self.lock_threshold:
            self.state = StreakState.LOCKED
            logger.error(
                f"🔒 Trading LOCKED after {abs(streak)} consecutive losses"
            )
        
        # Check for cold streak (3+ losses)
        elif streak <= -self.cold_streak_threshold:
            if self.state != StreakState.COLD_STREAK:
                self.state = StreakState.COLD_STREAK
                logger.warning(
                    f"❄️  Cold streak detected ({abs(streak)} losses)"
                )
        
        # Check for hot streak (5+ wins)
        elif streak >= self.hot_streak_threshold:
            if self.state != StreakState.HOT_STREAK:
                self.state = StreakState.HOT_STREAK
                logger.info(f"🔥 Hot streak! ({streak} wins)")
        
        # Normal state
        else:
            if self.state != StreakState.NORMAL:
                self.state = StreakState.NORMAL
                logger.info("↔️  Back to normal trading")
    
    def _save_state(self) -> None:
        """Save state to file."""
        try:
            data = {
                "metrics": {
                    "total_trades": self.metrics.total_trades,
                    "winning_trades": self.metrics.winning_trades,
                    "losing_trades": self.metrics.losing_trades,
                    "current_streak": self.metrics.current_streak,
                    "max_win_streak": self.metrics.max_win_streak,
                    "max_loss_streak": self.metrics.max_loss_streak,
                    "total_pnl": self.metrics.total_pnl,
                    "average_win": self.metrics.average_win,
                    "average_loss": self.metrics.average_loss
                },
                "state": self.state.value,
                "admin_override": self.admin_override,
                "override_reason": self.override_reason,
                "last_updated": datetime.now().isoformat()
            }
            
            with open(self.state_file, 'w') as f:
                json.dump(data, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to save streak state: {e}")
    
    def _load_state(self) -> None:
        """Load state from file."""
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
            
            # Load metrics
            m = data.get("metrics", {})
            self.metrics.total_trades = m.get("total_trades", 0)
            self.metrics.winning_trades = m.get("winning_trades", 0)
            self.metrics.losing_trades = m.get("losing_trades", 0)
            self.metrics.current_streak = m.get("current_streak", 0)
            self.metrics.max_win_streak = m.get("max_win_streak", 0)
            self.metrics.max_loss_streak = m.get("max_loss_streak", 0)
            self.metrics.total_pnl = m.get("total_pnl", 0.0)
            self.metrics.average_win = m.get("average_win", 0.0)
            self.metrics.average_loss = m.get("average_loss", 0.0)
            
            # Load state
            state_str = data.get("state", "normal")
            self.state = StreakState(state_str)
            
            # Load admin override
            self.admin_override = data.get("admin_override", False)
            self.override_reason = data.get("override_reason", "")
            
            logger.info(f"✅ Loaded streak state: {self.state.value}")
        
        except FileNotFoundError:
            logger.info("No existing streak state found, starting fresh")
        except Exception as e:
            logger.error(f"Failed to load streak state: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get full status report."""
        return {
            "state": self.state.value,
            "metrics": {
                "total_trades": self.metrics.total_trades,
                "win_rate": self.metrics.win_rate(),
                "profit_factor": self.metrics.profit_factor(),
                "current_streak": self.metrics.current_streak,
                "max_win_streak": self.metrics.max_win_streak,
                "max_loss_streak": self.metrics.max_loss_streak,
                "total_pnl": self.metrics.total_pnl
            },
            "risk_multiplier": self.get_risk_multiplier(),
            "confidence_score": self.get_confidence_score(),
            "locked": self.is_locked(),
            "admin_override": self.admin_override,
            "override_reason": self.override_reason,
            "market_health": self.get_market_health()
        }
