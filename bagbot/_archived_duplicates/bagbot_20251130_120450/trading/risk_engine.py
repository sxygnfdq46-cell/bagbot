"""
Risk Engine - Unified Risk Management for All Strategies and Markets

Core Philosophy: "Protect capital first. Grow capital second."

This engine unifies ALL risk management across:
- All strategies (Micro Trend Follower, Mean Reversion, etc.)
- All markets (Crypto, Forex, Stocks)
- All trading conditions (volatile, calm, news events)

Responsibilities:
- Position sizing (risk-based)
- Daily loss limits (kill-switch)
- Drawdown management (soft + hard)
- Per-trade risk (% of equity)
- Dynamic risk scaling (based on Mindset Engine)
- Emergency override (admin API)
- Spread & slippage detection
- Volatility-aware sizing
- Multi-market risk isolation
"""

import os
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class RiskMode(Enum):
    """Risk modes aligned with trading conditions."""
    CONSERVATIVE = "conservative"  # Lower risk after losses
    NORMAL = "normal"  # Default equilibrium
    AGGRESSIVE = "aggressive"  # Only after consistent wins


@dataclass
class RiskParameters:
    """Risk parameters for position sizing."""
    max_position_size_usd: float
    max_position_size_percent: float  # % of equity
    stop_loss_percent: float
    take_profit_percent: float
    max_daily_loss_percent: float
    max_drawdown_percent: float
    per_trade_risk_percent: float
    risk_multiplier: float = 1.0


@dataclass
class PositionSizeResult:
    """Result of position sizing calculation."""
    approved: bool
    position_size: float
    position_size_usd: float
    stop_loss: float
    take_profit: float
    risk_amount: float
    reason: str
    metadata: Dict[str, Any]


class RiskEngine:
    """
    Unified risk management engine.
    
    Integrates with:
    - Mindset Engine (emotional state)
    - Streak Manager (performance tracking)
    - News Filter (market conditions)
    - Market Router (multi-market isolation)
    """
    
    def __init__(self, state_dir: Optional[Path] = None):
        """Initialize risk engine."""
        if state_dir is None:
            state_dir = Path(__file__).parent.parent.parent / "data" / "state"
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(parents=True, exist_ok=True)
        
        self.risk_state_file = self.state_dir / "risk_state.json"
        
        # Load configuration from environment
        self.max_position_usd = float(os.getenv("MAX_POSITION_USD", "1000.0"))
        self.max_position_percent = float(os.getenv("MAX_POSITION_PERCENT", "10.0"))
        self.default_stop_loss = float(os.getenv("DEFAULT_STOP_LOSS_PERCENT", "2.0"))
        self.default_take_profit = float(os.getenv("DEFAULT_TAKE_PROFIT_PERCENT", "5.0"))
        self.max_daily_loss = float(os.getenv("MAX_DAILY_LOSS_PERCENT", "5.0"))
        self.max_drawdown = float(os.getenv("MAX_DRAWDOWN_PERCENT", "15.0"))
        self.per_trade_risk = float(os.getenv("PER_TRADE_RISK_PERCENT", "1.0"))
        
        # Risk mode
        self.current_mode = RiskMode.NORMAL
        
        # Daily tracking
        self.daily_loss_usd = 0.0
        self.daily_high_water_mark = 0.0
        self.starting_equity = 0.0
        
        # Emergency override
        self.emergency_shutdown = False
        self.shutdown_reason = ""
        
        # Market-specific risk tracking
        self.market_risk: Dict[str, float] = {}  # market -> allocated risk %
        
        # Load state
        self._load_state()
        
        logger.info(
            f"🛡️  RiskEngine initialized: "
            f"max_position=${self.max_position_usd:,.0f}, "
            f"daily_loss_limit={self.max_daily_loss}%, "
            f"per_trade_risk={self.per_trade_risk}%"
        )
    
    def calculate_position_size(
        self,
        symbol: str,
        side: str,
        entry_price: float,
        current_equity: float,
        stop_loss_percent: Optional[float] = None,
        take_profit_percent: Optional[float] = None,
        mindset_multiplier: float = 1.0,
        volatility: Optional[float] = None,
        spread: Optional[float] = None,
        market_type: str = "crypto"
    ) -> PositionSizeResult:
        """
        Calculate optimal position size based on risk parameters.
        
        Args:
            symbol: Trading symbol
            side: 'buy' or 'sell'
            entry_price: Entry price
            current_equity: Current account equity
            stop_loss_percent: Custom stop loss (optional)
            take_profit_percent: Custom take profit (optional)
            mindset_multiplier: Risk multiplier from Mindset Engine
            volatility: Current volatility measure
            spread: Bid-ask spread
            market_type: Market type (crypto, forex, stocks)
            
        Returns:
            PositionSizeResult with sizing decision
        """
        # Check emergency shutdown
        if self.emergency_shutdown:
            return PositionSizeResult(
                approved=False,
                position_size=0.0,
                position_size_usd=0.0,
                stop_loss=0.0,
                take_profit=0.0,
                risk_amount=0.0,
                reason=f"🚨 Emergency shutdown: {self.shutdown_reason}",
                metadata={}
            )
        
        # Initialize starting equity if needed
        if self.starting_equity == 0:
            self.starting_equity = current_equity
            self.daily_high_water_mark = current_equity
        
        # Check daily loss limit
        daily_loss_percent = (self.daily_loss_usd / self.starting_equity) * 100
        if daily_loss_percent >= self.max_daily_loss:
            self.emergency_shutdown = True
            self.shutdown_reason = f"Daily loss limit reached: {daily_loss_percent:.2f}%"
            self._save_state()
            
            return PositionSizeResult(
                approved=False,
                position_size=0.0,
                position_size_usd=0.0,
                stop_loss=0.0,
                take_profit=0.0,
                risk_amount=0.0,
                reason=f"🛑 Daily loss limit: {daily_loss_percent:.2f}%",
                metadata={"daily_loss": daily_loss_percent}
            )
        
        # Check drawdown limit
        drawdown_percent = ((self.daily_high_water_mark - current_equity) / self.daily_high_water_mark) * 100
        if drawdown_percent >= self.max_drawdown:
            return PositionSizeResult(
                approved=False,
                position_size=0.0,
                position_size_usd=0.0,
                stop_loss=0.0,
                take_profit=0.0,
                risk_amount=0.0,
                reason=f"📉 Max drawdown exceeded: {drawdown_percent:.2f}%",
                metadata={"drawdown": drawdown_percent}
            )
        
        # Get risk parameters
        stop_loss_pct = stop_loss_percent or self.default_stop_loss
        take_profit_pct = take_profit_percent or self.default_take_profit
        
        # Apply risk mode multiplier
        mode_multiplier = self._get_mode_multiplier()
        
        # Apply mindset multiplier
        combined_multiplier = mode_multiplier * mindset_multiplier
        
        # Apply volatility adjustment
        if volatility is not None:
            volatility_multiplier = self._calculate_volatility_multiplier(volatility)
            combined_multiplier *= volatility_multiplier
        
        # Calculate base position size (% of equity)
        base_position_percent = self.max_position_percent * combined_multiplier
        base_position_usd = (current_equity * base_position_percent) / 100
        
        # Limit by absolute max
        position_usd = min(base_position_usd, self.max_position_usd)
        
        # Calculate risk amount (per trade risk limit)
        max_risk_usd = (current_equity * self.per_trade_risk * combined_multiplier) / 100
        
        # Calculate position size based on stop loss
        # Risk = Position Size * Stop Loss %
        # Position Size = Risk / Stop Loss %
        stop_loss_based_size = (max_risk_usd / (stop_loss_pct / 100))
        
        # Use the smaller of the two
        final_position_usd = min(position_usd, stop_loss_based_size)
        
        # Calculate quantity
        position_size = final_position_usd / entry_price
        
        # Account for spread if provided
        if spread and spread > 0:
            spread_cost = position_size * spread
            final_position_usd -= spread_cost
            position_size = final_position_usd / entry_price
        
        # Calculate stop loss and take profit prices
        if side == "buy":
            stop_loss_price = entry_price * (1 - stop_loss_pct / 100)
            take_profit_price = entry_price * (1 + take_profit_pct / 100)
        else:
            stop_loss_price = entry_price * (1 + stop_loss_pct / 100)
            take_profit_price = entry_price * (1 - take_profit_pct / 100)
        
        # Calculate actual risk
        actual_risk = position_size * entry_price * (stop_loss_pct / 100)
        
        # Check multi-market risk allocation
        market_risk = self.market_risk.get(market_type, 0.0)
        market_risk_limit = 50.0  # Max 50% of equity in one market
        
        if market_risk + (final_position_usd / current_equity * 100) > market_risk_limit:
            return PositionSizeResult(
                approved=False,
                position_size=0.0,
                position_size_usd=0.0,
                stop_loss=stop_loss_price,
                take_profit=take_profit_price,
                risk_amount=0.0,
                reason=f"🌐 Market risk limit: {market_type} at {market_risk:.1f}%",
                metadata={"market_risk": market_risk}
            )
        
        logger.info(
            f"✅ Position sized: {symbol} {side} | "
            f"Size: ${final_position_usd:.2f} ({position_size:.6f}) | "
            f"Risk: ${actual_risk:.2f} | "
            f"Multiplier: {combined_multiplier:.2f}x | "
            f"Mode: {self.current_mode.value}"
        )
        
        return PositionSizeResult(
            approved=True,
            position_size=position_size,
            position_size_usd=final_position_usd,
            stop_loss=stop_loss_price,
            take_profit=take_profit_price,
            risk_amount=actual_risk,
            reason=f"Position approved (mode: {self.current_mode.value})",
            metadata={
                "mode": self.current_mode.value,
                "multiplier": combined_multiplier,
                "market_type": market_type,
                "daily_loss": daily_loss_percent,
                "drawdown": drawdown_percent
            }
        )
    
    def record_trade_result(
        self,
        profit_usd: float,
        market_type: str,
        position_size_usd: float
    ) -> None:
        """
        Record trade result and update risk state.
        
        Args:
            profit_usd: Profit/loss in USD
            market_type: Market type
            position_size_usd: Position size in USD
        """
        # Update daily loss
        if profit_usd < 0:
            self.daily_loss_usd += abs(profit_usd)
        
        # Update market risk allocation
        # (This would be more sophisticated in production)
        
        # Save state
        self._save_state()
        
        logger.info(
            f"📊 Trade recorded: {profit_usd:+.2f} USD | "
            f"Daily loss: ${self.daily_loss_usd:.2f}"
        )
    
    def set_risk_mode(self, mode: RiskMode, reason: str = "") -> None:
        """
        Set risk mode.
        
        Args:
            mode: Risk mode
            reason: Reason for change
        """
        old_mode = self.current_mode
        self.current_mode = mode
        
        logger.info(
            f"🔄 Risk mode: {old_mode.value} → {mode.value} | "
            f"Reason: {reason}"
        )
        
        self._save_state()
    
    def trigger_emergency_shutdown(self, reason: str) -> None:
        """
        Trigger emergency shutdown (kill-switch).
        
        Args:
            reason: Reason for shutdown
        """
        self.emergency_shutdown = True
        self.shutdown_reason = reason
        
        logger.critical(f"🚨 EMERGENCY SHUTDOWN: {reason}")
        
        self._save_state()
    
    def resume_from_shutdown(self, admin_override: bool = False) -> bool:
        """
        Resume from emergency shutdown.
        
        Args:
            admin_override: Force resume (admin only)
            
        Returns:
            True if resumed successfully
        """
        if not admin_override:
            # Check if conditions are safe to resume
            daily_loss_percent = (self.daily_loss_usd / self.starting_equity) * 100
            if daily_loss_percent >= self.max_daily_loss:
                logger.warning("Cannot resume: Daily loss limit still exceeded")
                return False
        
        self.emergency_shutdown = False
        self.shutdown_reason = ""
        
        logger.info("✅ Resumed from emergency shutdown")
        
        self._save_state()
        return True
    
    def reset_daily(self, current_equity: float) -> None:
        """
        Reset daily risk tracking.
        
        Args:
            current_equity: Current equity
        """
        self.starting_equity = current_equity
        self.daily_high_water_mark = current_equity
        self.daily_loss_usd = 0.0
        self.emergency_shutdown = False
        self.shutdown_reason = ""
        
        logger.info(f"🌅 Daily risk reset | Equity: ${current_equity:,.2f}")
        
        self._save_state()
    
    def get_risk_report(self, current_equity: float) -> Dict[str, Any]:
        """
        Generate risk assessment report.
        
        Args:
            current_equity: Current equity
            
        Returns:
            Risk report dictionary
        """
        daily_loss_percent = (self.daily_loss_usd / self.starting_equity) * 100 if self.starting_equity > 0 else 0
        drawdown_percent = ((self.daily_high_water_mark - current_equity) / self.daily_high_water_mark) * 100 if self.daily_high_water_mark > 0 else 0
        
        return {
            "mode": self.current_mode.value,
            "emergency_shutdown": self.emergency_shutdown,
            "shutdown_reason": self.shutdown_reason,
            "daily_loss_usd": self.daily_loss_usd,
            "daily_loss_percent": daily_loss_percent,
            "daily_loss_limit": self.max_daily_loss,
            "drawdown_percent": drawdown_percent,
            "drawdown_limit": self.max_drawdown,
            "risk_remaining": self.max_daily_loss - daily_loss_percent,
            "multiplier": self._get_mode_multiplier(),
            "market_risk": self.market_risk
        }
    
    def _get_mode_multiplier(self) -> float:
        """Get risk multiplier based on current mode."""
        multipliers = {
            RiskMode.CONSERVATIVE: 0.5,
            RiskMode.NORMAL: 1.0,
            RiskMode.AGGRESSIVE: 1.2  # Capped at +20%
        }
        return multipliers.get(self.current_mode, 1.0)
    
    def _calculate_volatility_multiplier(self, volatility: float) -> float:
        """
        Calculate risk multiplier based on volatility.
        
        Args:
            volatility: Volatility measure (0-100)
            
        Returns:
            Risk multiplier (0.5 to 1.0)
        """
        # High volatility = lower position size
        if volatility > 50:
            return 0.5
        elif volatility > 30:
            return 0.75
        else:
            return 1.0
    
    def _load_state(self) -> None:
        """Load risk state from disk."""
        if not self.risk_state_file.exists():
            return
        
        try:
            with open(self.risk_state_file, "r") as f:
                state = json.load(f)
            
            self.current_mode = RiskMode(state.get("mode", "normal"))
            self.daily_loss_usd = state.get("daily_loss_usd", 0.0)
            self.starting_equity = state.get("starting_equity", 0.0)
            self.daily_high_water_mark = state.get("daily_high_water_mark", 0.0)
            self.emergency_shutdown = state.get("emergency_shutdown", False)
            self.shutdown_reason = state.get("shutdown_reason", "")
            self.market_risk = state.get("market_risk", {})
            
            logger.info(f"📂 Loaded risk state: mode={self.current_mode.value}")
        
        except Exception as e:
            logger.error(f"Failed to load risk state: {e}")
    
    def _save_state(self) -> None:
        """Save risk state to disk."""
        state = {
            "mode": self.current_mode.value,
            "daily_loss_usd": self.daily_loss_usd,
            "starting_equity": self.starting_equity,
            "daily_high_water_mark": self.daily_high_water_mark,
            "emergency_shutdown": self.emergency_shutdown,
            "shutdown_reason": self.shutdown_reason,
            "market_risk": self.market_risk,
            "last_updated": datetime.now().isoformat()
        }
        
        with open(self.risk_state_file, "w") as f:
            json.dump(state, f, indent=2)
