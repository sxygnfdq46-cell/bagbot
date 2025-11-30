"""
Mindset Engine v2 - Advanced Trading Psychology System

This engine implements the psychological framework for BAGBOT2:
- Daily reset and performance evaluation
- Emotional guardrails (no revenge trading, no overtrading)
- Confidence meter for strategies
- Risk scaling based on performance
- Safety overrides and circuit breakers
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, time
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path

logger = logging.getLogger(__name__)


class EmotionalState(Enum):
    """Bot's psychological state."""
    CALM = "calm"  # Normal operations
    CAUTIOUS = "cautious"  # After small loss or near limit
    DEFENSIVE = "defensive"  # After significant loss
    CONFIDENT = "confident"  # After consistent wins
    LOCKED = "locked"  # Emergency stop triggered


class PerformanceGrade(Enum):
    """Daily performance grades."""
    EXCELLENT = "A+"  # >2% gain
    GOOD = "A"  # 0.5-2% gain
    ACCEPTABLE = "B"  # 0-0.5% gain
    POOR = "C"  # 0 to -2% loss
    FAILING = "F"  # > -2% loss


@dataclass
class DailyMetrics:
    """Daily performance metrics."""
    date: str
    starting_equity: float
    ending_equity: float
    pnl: float
    pnl_percent: float
    trades_count: int
    win_rate: float
    max_drawdown: float
    grade: str
    notes: str
    emotional_state: str
    

@dataclass
class StrategyConfidence:
    """Confidence metrics for a strategy."""
    strategy_name: str
    confidence_score: float  # 0.0 to 1.0
    win_rate: float
    avg_profit: float
    consecutive_wins: int
    consecutive_losses: int
    last_updated: str
    is_active: bool
    total_trades: int = 0
    total_wins: int = 0


class MindsetEngine:
    """
    Advanced psychological engine for disciplined trading.
    
    Philosophy:
    "My job is simple: protect capital, protect gains, always end each day positive.
    I reset every midnight, but I never sleep.
    I evaluate my performance daily.
    I stay calm, never panic, never revenge trade.
    I take small wins consistently rather than chasing big risks."
    """
    
    def __init__(self, state_dir: Optional[Path] = None):
        """Initialize the mindset engine."""
        # State directory
        if state_dir is None:
            state_dir = Path(__file__).parent.parent.parent / "data" / "state"
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(parents=True, exist_ok=True)
        
        # State files
        self.daily_metrics_file = self.state_dir / "daily_metrics.json"
        self.strategy_confidence_file = self.state_dir / "strategy_confidence.json"
        self.mindset_state_file = self.state_dir / "mindset_state.json"
        
        # Configuration from environment
        self.daily_profit_target = float(os.getenv("DAILY_PROFIT_TARGET_PERCENT", "1.0"))
        self.max_daily_loss = float(os.getenv("MAX_DAILY_LOSS_PERCENT", "3.0"))
        self.max_trades_per_day = int(os.getenv("MAX_TRADES_PER_DAY", "20"))
        self.revenge_trade_cooldown_minutes = int(os.getenv("REVENGE_TRADE_COOLDOWN", "30"))
        
        # State tracking
        self.current_date = datetime.now().date().isoformat()
        self.emotional_state = EmotionalState.CALM
        self.daily_trades_count = 0
        self.starting_equity: Optional[float] = None
        self.last_trade_time: Optional[datetime] = None
        self.last_trade_was_loss = False
        self.consecutive_losses = 0
        self.daily_high_water_mark = 0.0
        
        # Load existing state
        self._load_state()
        
        logger.info(
            f"🧠 MindsetEngine initialized: "
            f"target={self.daily_profit_target}%, "
            f"max_loss={self.max_daily_loss}%, "
            f"max_trades={self.max_trades_per_day}"
        )
    
    def reset_daily(self, current_equity: float) -> None:
        """
        Reset daily metrics at midnight.
        
        Args:
            current_equity: Current account equity
        """
        logger.info(f"🌅 Daily reset - Starting equity: ${current_equity:,.2f}")
        
        # Save yesterday's performance if we have data
        if self.starting_equity is not None:
            self._save_daily_performance(current_equity)
        
        # Reset for new day
        self.current_date = datetime.now().date().isoformat()
        self.starting_equity = current_equity
        self.daily_trades_count = 0
        self.last_trade_time = None
        self.last_trade_was_loss = False
        self.consecutive_losses = 0
        self.daily_high_water_mark = current_equity
        self.emotional_state = EmotionalState.CALM
        
        # Save state
        self._save_state()
    
    def evaluate_daily_performance(self, current_equity: float) -> DailyMetrics:
        """
        Evaluate performance and assign a grade.
        
        Args:
            current_equity: Current account equity
            
        Returns:
            DailyMetrics object with performance evaluation
        """
        if self.starting_equity is None:
            self.starting_equity = current_equity
        
        pnl = current_equity - self.starting_equity
        pnl_percent = (pnl / self.starting_equity) * 100 if self.starting_equity > 0 else 0.0
        
        # Calculate max drawdown
        if current_equity > self.daily_high_water_mark:
            self.daily_high_water_mark = current_equity
        drawdown = ((self.daily_high_water_mark - current_equity) / self.daily_high_water_mark) * 100
        
        # Assign grade
        if pnl_percent > 2.0:
            grade = PerformanceGrade.EXCELLENT
            notes = "Outstanding performance! Exceeded profit target."
        elif pnl_percent > 0.5:
            grade = PerformanceGrade.GOOD
            notes = "Good day. Consistent gains."
        elif pnl_percent > 0:
            grade = PerformanceGrade.ACCEPTABLE
            notes = "Positive but modest gains. Room for improvement."
        elif pnl_percent > -2.0:
            grade = PerformanceGrade.POOR
            notes = "Loss incurred. Review strategy and risk management."
        else:
            grade = PerformanceGrade.FAILING
            notes = "Significant loss. Immediate review required."
        
        metrics = DailyMetrics(
            date=self.current_date,
            starting_equity=self.starting_equity,
            ending_equity=current_equity,
            pnl=pnl,
            pnl_percent=pnl_percent,
            trades_count=self.daily_trades_count,
            win_rate=self._calculate_win_rate(),
            max_drawdown=drawdown,
            grade=grade.value,
            notes=notes,
            emotional_state=self.emotional_state.value
        )
        
        logger.info(
            f"📊 Daily Performance: {grade.value} | "
            f"P&L: ${pnl:,.2f} ({pnl_percent:+.2f}%) | "
            f"Trades: {self.daily_trades_count} | "
            f"Emotion: {self.emotional_state.value}"
        )
        
        return metrics
    
    def should_trade(
        self,
        current_equity: float,
        proposed_trade: Dict[str, Any]
    ) -> tuple[bool, str]:
        """
        Determine if a trade should be executed based on psychological state.
        
        Args:
            current_equity: Current account equity
            proposed_trade: Trade details (symbol, side, quantity, etc.)
            
        Returns:
            Tuple of (should_trade, reason)
        """
        # Check if new day - auto reset at midnight
        if datetime.now().date().isoformat() != self.current_date:
            self.reset_daily(current_equity)
        
        # Emergency stop check
        if self.emotional_state == EmotionalState.LOCKED:
            return False, "🔒 Trading locked due to emergency circuit breaker"
        
        # Check daily loss limit
        if self.starting_equity is not None:
            pnl_percent = ((current_equity - self.starting_equity) / self.starting_equity) * 100
            if pnl_percent <= -self.max_daily_loss:
                self.emotional_state = EmotionalState.LOCKED
                self._save_state()
                return False, f"🛑 Daily loss limit reached ({pnl_percent:.2f}%)"
        
        # Check max trades per day
        if self.daily_trades_count >= self.max_trades_per_day:
            return False, f"📊 Max trades per day reached ({self.max_trades_per_day})"
        
        # Revenge trade prevention
        if self.last_trade_was_loss and self.last_trade_time:
            cooldown = timedelta(minutes=self.revenge_trade_cooldown_minutes)
            if datetime.now() - self.last_trade_time < cooldown:
                return False, f"⏳ Revenge trade cooldown active (wait {self.revenge_trade_cooldown_minutes}min after loss)"
        
        # Defensive state - reduced position sizing
        if self.emotional_state == EmotionalState.DEFENSIVE:
            if self.consecutive_losses >= 3:
                return False, f"🛡️ Defensive mode: {self.consecutive_losses} consecutive losses"
        
        return True, f"✅ Trade approved - Emotional state: {self.emotional_state.value}"
    
    def record_trade_outcome(
        self,
        trade: Dict[str, Any],
        profit: float,
        profit_percent: float
    ) -> None:
        """
        Record trade outcome and update psychological state.
        
        Args:
            trade: Trade details
            profit: Profit/loss in USD
            profit_percent: Profit/loss as percentage
        """
        self.daily_trades_count += 1
        self.last_trade_time = datetime.now()
        
        is_win = profit > 0
        self.last_trade_was_loss = not is_win
        
        if is_win:
            self.consecutive_losses = 0
            
            # Upgrade emotional state
            if profit_percent > 2.0:
                self.emotional_state = EmotionalState.CONFIDENT
            elif self.emotional_state == EmotionalState.DEFENSIVE:
                self.emotional_state = EmotionalState.CAUTIOUS
            elif self.emotional_state == EmotionalState.CAUTIOUS:
                self.emotional_state = EmotionalState.CALM
            
            logger.info(f"✅ Win: ${profit:,.2f} ({profit_percent:+.2f}%) | State: {self.emotional_state.value}")
        else:
            self.consecutive_losses += 1
            
            # Downgrade emotional state
            if self.consecutive_losses >= 3:
                self.emotional_state = EmotionalState.DEFENSIVE
            elif profit_percent < -2.0:
                self.emotional_state = EmotionalState.DEFENSIVE
            else:
                self.emotional_state = EmotionalState.CAUTIOUS
            
            logger.warning(
                f"❌ Loss: ${profit:,.2f} ({profit_percent:+.2f}%) | "
                f"Consecutive: {self.consecutive_losses} | "
                f"State: {self.emotional_state.value}"
            )
        
        self._save_state()
    
    def get_risk_multiplier(self) -> float:
        """
        Get risk multiplier based on emotional state.
        
        Returns:
            Risk multiplier (0.0 to 1.5)
        """
        multipliers = {
            EmotionalState.LOCKED: 0.0,
            EmotionalState.DEFENSIVE: 0.5,
            EmotionalState.CAUTIOUS: 0.75,
            EmotionalState.CALM: 1.0,
            EmotionalState.CONFIDENT: 1.25
        }
        return multipliers.get(self.emotional_state, 1.0)
    
    def update_strategy_confidence(
        self,
        strategy_name: str,
        trade_result: Dict[str, Any]
    ) -> StrategyConfidence:
        """
        Update confidence metrics for a strategy.
        
        Args:
            strategy_name: Name of the strategy
            trade_result: Trade outcome (profit, win/loss, etc.)
            
        Returns:
            Updated StrategyConfidence
        """
        # Load existing confidence data
        confidence_data = self._load_strategy_confidence()
        
        if strategy_name not in confidence_data:
            confidence_data[strategy_name] = {
                "strategy_name": strategy_name,
                "confidence_score": 0.5,
                "win_rate": 0.0,
                "avg_profit": 0.0,
                "consecutive_wins": 0,
                "consecutive_losses": 0,
                "last_updated": datetime.now().isoformat(),
                "is_active": True,
                "total_trades": 0,
                "total_wins": 0
            }
        
        data = confidence_data[strategy_name]
        is_win = trade_result.get("profit", 0) > 0
        
        # Update counters
        data["total_trades"] += 1
        if is_win:
            data["total_wins"] += 1
            data["consecutive_wins"] += 1
            data["consecutive_losses"] = 0
        else:
            data["consecutive_wins"] = 0
            data["consecutive_losses"] += 1
        
        # Calculate win rate
        data["win_rate"] = (data["total_wins"] / data["total_trades"]) * 100
        
        # Calculate confidence score (0.0 to 1.0)
        win_rate_factor = data["win_rate"] / 100
        consistency_factor = 1.0 - (data["consecutive_losses"] * 0.1)
        consistency_factor = max(0.0, min(1.0, consistency_factor))
        
        data["confidence_score"] = (win_rate_factor * 0.7 + consistency_factor * 0.3)
        data["last_updated"] = datetime.now().isoformat()
        
        # Save
        confidence_data[strategy_name] = data
        self._save_strategy_confidence(confidence_data)
        
        # Convert to dataclass
        confidence = StrategyConfidence(**data)
        
        logger.info(
            f"📈 Strategy '{strategy_name}' confidence: {confidence.confidence_score:.2f} | "
            f"Win rate: {confidence.win_rate:.1f}%"
        )
        
        return confidence
    
    def get_strategy_confidence(self, strategy_name: str) -> Optional[StrategyConfidence]:
        """Get confidence metrics for a strategy."""
        data = self._load_strategy_confidence()
        if strategy_name in data:
            return StrategyConfidence(**data[strategy_name])
        return None
    
    def _calculate_win_rate(self) -> float:
        """Calculate win rate from daily metrics (placeholder)."""
        # TODO: Track individual trades
        return 0.0
    
    def _save_daily_performance(self, ending_equity: float) -> None:
        """Save daily performance to history."""
        metrics = self.evaluate_daily_performance(ending_equity)
        
        # Load existing metrics
        all_metrics = []
        if self.daily_metrics_file.exists():
            with open(self.daily_metrics_file, "r") as f:
                all_metrics = json.load(f)
        
        # Append new metrics
        all_metrics.append(asdict(metrics))
        
        # Save
        with open(self.daily_metrics_file, "w") as f:
            json.dump(all_metrics, f, indent=2)
    
    def _load_state(self) -> None:
        """Load mindset state from disk."""
        if not self.mindset_state_file.exists():
            return
        
        try:
            with open(self.mindset_state_file, "r") as f:
                state = json.load(f)
            
            self.current_date = state.get("current_date", datetime.now().date().isoformat())
            self.emotional_state = EmotionalState(state.get("emotional_state", "calm"))
            self.daily_trades_count = state.get("daily_trades_count", 0)
            self.starting_equity = state.get("starting_equity")
            self.consecutive_losses = state.get("consecutive_losses", 0)
            self.daily_high_water_mark = state.get("daily_high_water_mark", 0.0)
            
            # Parse last trade time
            if state.get("last_trade_time"):
                self.last_trade_time = datetime.fromisoformat(state["last_trade_time"])
            
            logger.info(f"📂 Loaded mindset state: {self.emotional_state.value}")
        
        except Exception as e:
            logger.error(f"Failed to load mindset state: {e}")
    
    def _save_state(self) -> None:
        """Save mindset state to disk."""
        state = {
            "current_date": self.current_date,
            "emotional_state": self.emotional_state.value,
            "daily_trades_count": self.daily_trades_count,
            "starting_equity": self.starting_equity,
            "consecutive_losses": self.consecutive_losses,
            "daily_high_water_mark": self.daily_high_water_mark,
            "last_trade_time": self.last_trade_time.isoformat() if self.last_trade_time else None
        }
        
        with open(self.mindset_state_file, "w") as f:
            json.dump(state, f, indent=2)
    
    def _load_strategy_confidence(self) -> Dict[str, Any]:
        """Load strategy confidence data."""
        if not self.strategy_confidence_file.exists():
            return {}
        
        with open(self.strategy_confidence_file, "r") as f:
            return json.load(f)
    
    def _save_strategy_confidence(self, data: Dict[str, Any]) -> None:
        """Save strategy confidence data."""
        with open(self.strategy_confidence_file, "w") as f:
            json.dump(data, f, indent=2)
    
    def get_risk_multiplier(self) -> float:
        """
        Get risk multiplier based on current emotional state.
        
        Returns:
            Risk multiplier (0.0 to 1.5):
            - LOCKED: 0.0 (no trading)
            - DEFENSIVE: 0.5 (half size)
            - CAUTIOUS: 0.75 (reduced size)
            - CALM: 1.0 (normal size)
            - CONFIDENT: 1.25 (slightly increased)
        """
        multipliers = {
            EmotionalState.DEFENSIVE: 0.5,
            EmotionalState.CAUTIOUS: 0.75,
            EmotionalState.CALM: 1.0,
            EmotionalState.CONFIDENT: 1.25,
            EmotionalState.LOCKED: 0.0
        }
        return multipliers.get(self.emotional_state, 1.0)
    
    def get_strategy_confidence(self, strategy_name: str) -> Optional[StrategyConfidence]:
        """
        Get confidence metrics for a specific strategy.
        
        Args:
            strategy_name: Name of the strategy to query
            
        Returns:
            StrategyConfidence object or None if strategy not tracked
        """
        confidence_data = self._load_strategy_confidence()
        
        if strategy_name not in confidence_data:
            return None
        
        data = confidence_data[strategy_name]
        
        # Ensure all required fields are present with defaults
        return StrategyConfidence(
            strategy_name=data.get("strategy_name", strategy_name),
            confidence_score=data.get("confidence_score", 0.0),
            win_rate=data.get("win_rate", 0.0),
            avg_profit=data.get("avg_profit", 0.0),
            consecutive_wins=data.get("consecutive_wins", 0),
            consecutive_losses=data.get("consecutive_losses", 0),
            last_updated=data.get("last_updated", datetime.now().isoformat()),
            is_active=data.get("is_active", True),
            total_trades=data.get("total_trades", 0),
            total_wins=data.get("total_wins", 0)
        )
