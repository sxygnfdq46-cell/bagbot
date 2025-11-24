"""
Trading Mindset Module - Disciplined Trading Psychology

This module implements institutional-grade trading discipline and risk management
psychology. It enforces stop-losses, drawdown limits, and defensive behaviors
after losses to protect capital.
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


# Import pause state checker
try:
    from backend.trading_state import is_trading_paused, get_trading_state
except ImportError:
    # Fallback if module not available
    def is_trading_paused() -> bool:
        return False
    
    def get_trading_state() -> Dict[str, Any]:
        return {"paused": False, "reason": None}


class ActionType(Enum):
    """Types of trading actions."""
    OPEN_POSITION = "open_position"
    CLOSE_POSITION = "close_position"
    ADJUST_STOP_LOSS = "adjust_stop_loss"
    HEDGE_POSITION = "hedge_position"
    DO_NOTHING = "do_nothing"
    EMERGENCY_EXIT = "emergency_exit"


class EODAction(Enum):
    """End of day action types."""
    CLOSE_ALL = "close_all"
    HEDGE_ALL = "hedge_all"
    TIGHTEN_STOPS = "tighten_stops"
    MAINTAIN = "maintain"


@dataclass
class TradingAction:
    """Represents a trading action decision."""
    action_type: ActionType
    symbol: Optional[str] = None
    side: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    reason: str = ""
    priority: int = 0  # Higher = more urgent


@dataclass
class PreTradeCheckResult:
    """Result of pre-trade validation."""
    approved: bool
    reason: str
    suggested_stop_loss: Optional[float] = None


@dataclass
class EODReport:
    """End of day analysis and recommendations."""
    total_pnl: float
    total_pnl_percent: float
    drawdown_percent: float
    open_positions_count: int
    recommended_action: EODAction
    should_stop_trading: bool
    analysis: str
    actions: List[TradingAction]


class TradingMindset:
    """
    Implements disciplined trading psychology and risk management.
    
    Core Principles:
    1. Every trade must have a stop-loss
    2. Never increase exposure after a loss
    3. Respect daily drawdown limits
    4. Protect capital above all else
    """
    
    def __init__(self):
        """Initialize trading mindset with environment configuration."""
        # Load configuration from environment
        self.max_order_usd = float(os.getenv("MAX_ORDER_USD", "10000.0"))
        self.daily_max_drawdown_percent = float(os.getenv("DAILY_MAX_DRAWDOWN_PERCENT", "5.0"))
        self.stop_loss_percent = float(os.getenv("DEFAULT_STOP_LOSS_PERCENT", "2.0"))
        self.max_open_positions = int(os.getenv("MAX_OPEN_POSITIONS", "5"))
        self.eod_action_on_loss = os.getenv("EOD_ACTION", "tighten_stops")  # close_all, hedge_all, tighten_stops
        
        # Track daily performance
        self.daily_start_equity: Optional[float] = None
        self.daily_trades: List[Dict[str, Any]] = []
        self.last_trade_was_loss: bool = False
        self.consecutive_losses: int = 0
        self.trading_halted: bool = False
        self.halt_reason: str = ""
        
        logger.info(
            f"TradingMindset initialized: "
            f"max_order=${self.max_order_usd}, "
            f"daily_drawdown_limit={self.daily_max_drawdown_percent}%, "
            f"default_stop_loss={self.stop_loss_percent}%"
        )
    
    def daily_mission(
        self,
        account: Dict[str, Any],
        open_positions: List[Dict[str, Any]],
        signals: List[Dict[str, Any]]
    ) -> List[TradingAction]:
        """
        Determine daily trading actions based on account state and signals.
        
        Args:
            account: Account information with balance, equity, etc.
            open_positions: List of currently open positions
            signals: List of trading signals to consider
        
        Returns:
            List of TradingAction objects prioritized by urgency
        """
        # Check if trading is paused via admin API
        if is_trading_paused():
            state = get_trading_state()
            reason = state.get("reason", "Admin pause")
            logger.warning(f"⏸️  Trading paused via admin: {reason}")
            
            # Only manage existing positions (stop-loss checks)
            actions = []
            for position in open_positions:
                stop_loss_action = self._check_stop_loss(position, account)
                if stop_loss_action:
                    actions.append(stop_loss_action)
            
            if actions:
                logger.info(f"Managing {len(actions)} positions during pause")
            return sorted(actions, key=lambda x: x.priority, reverse=True)
        
        actions: List[TradingAction] = []
        
        # Initialize daily tracking if needed
        if self.daily_start_equity is None:
            self.daily_start_equity = account.get("equity", account.get("balance", 0))
            logger.info(f"Daily mission started with equity: ${self.daily_start_equity:,.2f}")
        
        current_equity = account.get("equity", account.get("balance", 0))
        
        # Check for drawdown breach
        drawdown_percent = self._calculate_drawdown_percent(current_equity)
        if drawdown_percent >= self.daily_max_drawdown_percent:
            logger.error(
                f"Daily drawdown limit breached: {drawdown_percent:.2f}% "
                f">= {self.daily_max_drawdown_percent}%"
            )
            self.trading_halted = True
            self.halt_reason = f"Daily drawdown limit breached ({drawdown_percent:.2f}%)"
            
            # Emergency exit all positions
            for position in open_positions:
                actions.append(TradingAction(
                    action_type=ActionType.EMERGENCY_EXIT,
                    symbol=position.get("symbol"),
                    side="sell" if position.get("side") == "long" else "buy",
                    quantity=position.get("size", 0),
                    reason=f"Emergency exit due to drawdown breach ({drawdown_percent:.2f}%)",
                    priority=100
                ))
            
            return sorted(actions, key=lambda x: x.priority, reverse=True)
        
        # If trading is halted, only manage existing positions
        if self.trading_halted:
            logger.warning(f"Trading halted: {self.halt_reason}")
            # Check stop losses on existing positions
            for position in open_positions:
                stop_loss_action = self._check_stop_loss(position, account)
                if stop_loss_action:
                    actions.append(stop_loss_action)
            return sorted(actions, key=lambda x: x.priority, reverse=True)
        
        # Check stop losses on all open positions (highest priority)
        for position in open_positions:
            stop_loss_action = self._check_stop_loss(position, account)
            if stop_loss_action:
                actions.append(stop_loss_action)
        
        # If we just had a loss, don't open new positions (defensive mode)
        if self.last_trade_was_loss or self.consecutive_losses > 0:
            logger.warning(
                f"Defensive mode: consecutive_losses={self.consecutive_losses}, "
                f"not opening new positions"
            )
            return sorted(actions, key=lambda x: x.priority, reverse=True)
        
        # Check if we're at max open positions
        if len(open_positions) >= self.max_open_positions:
            logger.info(f"At max open positions ({self.max_open_positions}), not opening new")
            return sorted(actions, key=lambda x: x.priority, reverse=True)
        
        # Process signals (only if not in defensive mode)
        for signal in signals:
            action = self._process_signal(signal, account, open_positions)
            if action:
                actions.append(action)
        
        return sorted(actions, key=lambda x: x.priority, reverse=True)
    
    def pre_trade_check(
        self,
        order_payload: Dict[str, Any],
        account: Dict[str, Any]
    ) -> PreTradeCheckResult:
        """
        Validate order before execution with strict risk checks.
        
        Args:
            order_payload: Order parameters (symbol, side, qty, price, etc.)
            account: Account information
        
        Returns:
            PreTradeCheckResult with approval status and reason
        """
        # Check 0: Admin pause state
        if is_trading_paused():
            state = get_trading_state()
            reason = state.get("reason", "Admin pause")
            return PreTradeCheckResult(
                approved=False,
                reason=f"Trading paused via admin: {reason}"
            )
        
        symbol = order_payload.get("symbol")
        side = order_payload.get("side")
        quantity = float(order_payload.get("amount", 0))
        price = order_payload.get("price")
        stop_loss = order_payload.get("stop_loss")
        
        # Check 1: Trading halted?
        if self.trading_halted:
            return PreTradeCheckResult(
                approved=False,
                reason=f"Trading halted: {self.halt_reason}"
            )
        
        # Check 2: Stop-loss required
        if stop_loss is None:
            # Calculate suggested stop-loss
            if price:
                suggested_sl = self._calculate_stop_loss(float(price), side)
                return PreTradeCheckResult(
                    approved=False,
                    reason="Stop-loss is required for all trades",
                    suggested_stop_loss=suggested_sl
                )
            else:
                return PreTradeCheckResult(
                    approved=False,
                    reason="Stop-loss is required and price not available to calculate"
                )
        
        # Check 3: Order size within limits
        if price:
            order_value = quantity * float(price)
            if order_value > self.max_order_usd:
                return PreTradeCheckResult(
                    approved=False,
                    reason=f"Order value ${order_value:,.2f} exceeds MAX_ORDER_USD ${self.max_order_usd:,.2f}"
                )
        
        # Check 4: Don't increase exposure after loss
        if self.last_trade_was_loss:
            return PreTradeCheckResult(
                approved=False,
                reason="Cannot open new positions after a loss (defensive mode)"
            )
        
        # Check 5: Drawdown limit
        current_equity = account.get("equity", account.get("balance", 0))
        drawdown_percent = self._calculate_drawdown_percent(current_equity)
        
        if drawdown_percent >= self.daily_max_drawdown_percent * 0.8:  # 80% of limit
            return PreTradeCheckResult(
                approved=False,
                reason=f"Approaching daily drawdown limit ({drawdown_percent:.2f}% / {self.daily_max_drawdown_percent}%)"
            )
        
        # Check 6: Validate stop-loss is reasonable
        if price and stop_loss:
            stop_loss_distance = abs(float(price) - float(stop_loss)) / float(price) * 100
            if stop_loss_distance > 10:  # More than 10% stop loss is too wide
                return PreTradeCheckResult(
                    approved=False,
                    reason=f"Stop-loss too wide ({stop_loss_distance:.2f}%), max 10%"
                )
            if stop_loss_distance < 0.5:  # Less than 0.5% is too tight
                return PreTradeCheckResult(
                    approved=False,
                    reason=f"Stop-loss too tight ({stop_loss_distance:.2f}%), min 0.5%"
                )
        
        logger.info(f"Pre-trade check passed for {side} {quantity} {symbol}")
        return PreTradeCheckResult(
            approved=True,
            reason="All checks passed"
        )
    
    def eod_routine(
        self,
        open_positions: List[Dict[str, Any]],
        account: Dict[str, Any]
    ) -> EODReport:
        """
        End of day analysis and risk management.
        
        Args:
            open_positions: List of currently open positions
            account: Account information
        
        Returns:
            EODReport with analysis and recommended actions
        """
        current_equity = account.get("equity", account.get("balance", 0))
        
        if self.daily_start_equity is None:
            self.daily_start_equity = current_equity
        
        # Calculate daily P&L
        total_pnl = current_equity - self.daily_start_equity
        total_pnl_percent = (total_pnl / self.daily_start_equity * 100) if self.daily_start_equity > 0 else 0
        drawdown_percent = self._calculate_drawdown_percent(current_equity)
        
        # Determine recommended action
        recommended_action = EODAction.MAINTAIN
        should_stop_trading = False
        actions: List[TradingAction] = []
        analysis_parts = []
        
        # Analysis based on P&L
        if total_pnl < 0:
            analysis_parts.append(f"Daily loss: ${abs(total_pnl):,.2f} ({total_pnl_percent:.2f}%)")
            
            if drawdown_percent >= self.daily_max_drawdown_percent:
                # Breached drawdown limit
                recommended_action = EODAction.CLOSE_ALL
                should_stop_trading = True
                analysis_parts.append("⚠️ CRITICAL: Daily drawdown limit breached")
                
                # Close all positions
                for position in open_positions:
                    actions.append(TradingAction(
                        action_type=ActionType.EMERGENCY_EXIT,
                        symbol=position.get("symbol"),
                        side="sell" if position.get("side") == "long" else "buy",
                        quantity=position.get("size", 0),
                        reason="EOD emergency exit due to drawdown breach",
                        priority=100
                    ))
            
            elif drawdown_percent >= self.daily_max_drawdown_percent * 0.7:
                # Approaching limit (70%+)
                if self.eod_action_on_loss == "close_all":
                    recommended_action = EODAction.CLOSE_ALL
                    analysis_parts.append("Closing all positions due to significant daily loss")
                    for position in open_positions:
                        actions.append(TradingAction(
                            action_type=ActionType.CLOSE_POSITION,
                            symbol=position.get("symbol"),
                            side="sell" if position.get("side") == "long" else "buy",
                            quantity=position.get("size", 0),
                            reason="EOD close due to daily loss",
                            priority=80
                        ))
                
                elif self.eod_action_on_loss == "hedge_all":
                    recommended_action = EODAction.HEDGE_ALL
                    analysis_parts.append("Hedging positions due to daily loss")
                    for position in open_positions:
                        actions.append(TradingAction(
                            action_type=ActionType.HEDGE_POSITION,
                            symbol=position.get("symbol"),
                            side="buy" if position.get("side") == "long" else "sell",
                            quantity=position.get("size", 0),
                            reason="EOD hedge due to daily loss",
                            priority=70
                        ))
                
                else:  # tighten_stops
                    recommended_action = EODAction.TIGHTEN_STOPS
                    analysis_parts.append("Tightening stop-losses due to daily loss")
                    for position in open_positions:
                        new_stop = self._calculate_tighter_stop_loss(position)
                        if new_stop:
                            actions.append(TradingAction(
                                action_type=ActionType.ADJUST_STOP_LOSS,
                                symbol=position.get("symbol"),
                                stop_loss=new_stop,
                                reason="EOD tighten stop-loss",
                                priority=60
                            ))
            
            else:
                # Minor loss, tighten stops
                recommended_action = EODAction.TIGHTEN_STOPS
                analysis_parts.append("Minor daily loss, tightening stops as precaution")
        
        else:
            analysis_parts.append(f"Daily profit: ${total_pnl:,.2f} ({total_pnl_percent:.2f}%)")
            recommended_action = EODAction.MAINTAIN
            analysis_parts.append("Maintaining current positions")
        
        analysis = " | ".join(analysis_parts)
        
        # Reset daily tracking for next day
        self._reset_daily_state()
        
        report = EODReport(
            total_pnl=total_pnl,
            total_pnl_percent=total_pnl_percent,
            drawdown_percent=drawdown_percent,
            open_positions_count=len(open_positions),
            recommended_action=recommended_action,
            should_stop_trading=should_stop_trading,
            analysis=analysis,
            actions=sorted(actions, key=lambda x: x.priority, reverse=True)
        )
        
        logger.info(f"EOD Report: {analysis}")
        return report
    
    def record_trade_result(self, pnl: float) -> None:
        """
        Record trade result to update defensive state.
        
        Args:
            pnl: Profit/loss from the trade
        """
        if pnl < 0:
            self.last_trade_was_loss = True
            self.consecutive_losses += 1
            logger.warning(f"Trade loss recorded: ${pnl:.2f}, consecutive losses: {self.consecutive_losses}")
        else:
            self.last_trade_was_loss = False
            self.consecutive_losses = 0
            logger.info(f"Trade profit recorded: ${pnl:.2f}, resetting defensive mode")
    
    def _calculate_drawdown_percent(self, current_equity: float) -> float:
        """Calculate current drawdown percentage."""
        if self.daily_start_equity is None or self.daily_start_equity == 0:
            return 0.0
        
        drawdown = self.daily_start_equity - current_equity
        if drawdown <= 0:
            return 0.0
        
        return (drawdown / self.daily_start_equity) * 100
    
    def _calculate_stop_loss(self, entry_price: float, side: str) -> float:
        """Calculate stop-loss price based on entry price and side."""
        if side.lower() == "buy":
            # For long positions, stop-loss below entry
            return entry_price * (1 - self.stop_loss_percent / 100)
        else:
            # For short positions, stop-loss above entry
            return entry_price * (1 + self.stop_loss_percent / 100)
    
    def _check_stop_loss(
        self,
        position: Dict[str, Any],
        account: Dict[str, Any]
    ) -> Optional[TradingAction]:
        """Check if position should be stopped out."""
        symbol = position.get("symbol")
        current_price = position.get("current_price")
        stop_loss = position.get("stop_loss")
        side = position.get("side")
        size = position.get("size", 0)
        
        if not stop_loss or not current_price:
            return None
        
        # Check if stop-loss is hit
        if side == "long" and current_price <= stop_loss:
            logger.warning(f"Stop-loss hit for {symbol}: price {current_price} <= stop {stop_loss}")
            return TradingAction(
                action_type=ActionType.CLOSE_POSITION,
                symbol=symbol,
                side="sell",
                quantity=size,
                reason=f"Stop-loss triggered at {stop_loss}",
                priority=90
            )
        
        elif side == "short" and current_price >= stop_loss:
            logger.warning(f"Stop-loss hit for {symbol}: price {current_price} >= stop {stop_loss}")
            return TradingAction(
                action_type=ActionType.CLOSE_POSITION,
                symbol=symbol,
                side="buy",
                quantity=size,
                reason=f"Stop-loss triggered at {stop_loss}",
                priority=90
            )
        
        return None
    
    def _process_signal(
        self,
        signal: Dict[str, Any],
        account: Dict[str, Any],
        open_positions: List[Dict[str, Any]]
    ) -> Optional[TradingAction]:
        """Process trading signal and create action if valid."""
        symbol = signal.get("symbol")
        side = signal.get("side")
        quantity = signal.get("quantity", 0)
        price = signal.get("price")
        
        if not all([symbol, side, quantity, price]):
            return None
        
        # Calculate stop-loss for this signal
        stop_loss = self._calculate_stop_loss(float(price), side)
        
        return TradingAction(
            action_type=ActionType.OPEN_POSITION,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            stop_loss=stop_loss,
            reason="Signal processed with auto stop-loss",
            priority=50
        )
    
    def _calculate_tighter_stop_loss(
        self,
        position: Dict[str, Any]
    ) -> Optional[float]:
        """Calculate a tighter stop-loss for risk reduction."""
        current_price = position.get("current_price")
        side = position.get("side")
        current_stop = position.get("stop_loss")
        
        if not current_price:
            return None
        
        # Tighten stop-loss to 1% (half of default 2%)
        tight_stop_percent = self.stop_loss_percent / 2
        
        if side == "long":
            new_stop = current_price * (1 - tight_stop_percent / 100)
            # Only move stop-loss up (never down)
            if current_stop and new_stop > current_stop:
                return new_stop
        else:  # short
            new_stop = current_price * (1 + tight_stop_percent / 100)
            # Only move stop-loss down (never up)
            if current_stop and new_stop < current_stop:
                return new_stop
        
        return None
    
    def _reset_daily_state(self) -> None:
        """Reset daily tracking for new trading day."""
        self.daily_start_equity = None
        self.daily_trades = []
        if not self.trading_halted:  # Don't reset if halted
            self.last_trade_was_loss = False
            self.consecutive_losses = 0
        logger.info("Daily state reset for new trading day")
