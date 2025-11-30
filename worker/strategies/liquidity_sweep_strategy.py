"""Liquidity Sweep Strategy - Trades liquidity grabs."""

import logging
from typing import Dict, Any, Optional, List

from worker.strategies.arsenal import BaseStrategy

logger = logging.getLogger(__name__)


class LiquiditySweepStrategy(BaseStrategy):
    """Trades liquidity sweeps - when smart money grabs stops."""
    
    def __init__(self, sweep_threshold: float = 0.001):
        from worker.strategies.arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="LiquiditySweep",
            description="Liquidity sweeps",
            version="1.0.0",
            author="BAGBOT2",
            strategy_type=StrategyType.TREND_FOLLOWING,
            timeframe=TimeFrame.M15,
            markets=[MarketType.FOREX, MarketType.CRYPTO],
            risk_level=3,
            min_capital=100.0,
            max_position_size=0.02,
            default_stop_loss_percent=1.0,
            default_take_profit_percent=2.0
        )
        super().__init__(metadata=metadata)
        self.sweep_threshold = sweep_threshold
        logger.info("💧 Liquidity Sweep strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect liquidity sweeps."""
        if len(candles) < 5:
            return None
        
        recent = candles[-5:]
        current = candles[-1]
        
        # Find swing high/low
        highs = [c["high"] for c in recent[:-1]]
        lows = [c["low"] for c in recent[:-1]]
        
        swing_high = max(highs)
        swing_low = min(lows)
        
        # Bullish sweep: wick below swing low then close above
        if (current["low"] < swing_low and 
            current["close"] > swing_low and
            (current["close"] - current["low"]) / current["low"] > self.sweep_threshold):
            return {
                "action": "buy",
                "entry": current["close"],
                "stop_loss": current["low"],
                "take_profit": swing_high,
                "reason": f"Bullish liquidity sweep at {swing_low:.5f}"
            }
        
        # Bearish sweep: wick above swing high then close below
        if (current["high"] > swing_high and 
            current["close"] < swing_high and
            (current["high"] - current["close"]) / current["high"] > self.sweep_threshold):
            return {
                "action": "sell",
                "entry": current["close"],
                "stop_loss": current["high"],
                "take_profit": swing_low,
                "reason": f"Bearish liquidity sweep at {swing_high:.5f}"
            }
        
        return None
    def generate_signals(self, market_data: Dict, account: Dict) -> List:
        """Generate signals from market data."""
        candles = market_data.get("candles", [])
        signal_data = self.analyze(candles)
        if signal_data:
            from worker.strategies.arsenal import Signal, OrderSide, OrderType
            side = OrderSide.BUY if signal_data["action"] == "buy" else OrderSide.SELL
            return [Signal(
                strategy_name=self.metadata.name,
                symbol=market_data.get("symbol", "UNKNOWN"),
                side=side,
                order_type=OrderType.LIMIT,
                entry_price=signal_data["entry"],
                stop_loss=signal_data.get("stop_loss"),
                take_profit=signal_data.get("take_profit"),
                reason=signal_data["reason"]
            )]
        return []
    
    def on_tick(self, tick: Dict) -> Optional[Dict]:
        """Handle tick data."""
        return None
    
    def on_trade_executed(self, trade: Dict) -> None:
        """Handle trade execution."""
        pass
    
    def on_trade_closed(self, trade: Dict) -> None:
        """Handle trade closure."""
        pass
    def generate_signals(self, market_data: Dict, account: Dict) -> List:
        """Generate signals from market data."""
        candles = market_data.get("candles", [])
        signal_data = self.analyze(candles)
        if signal_data:
            from worker.strategies.arsenal import Signal, OrderSide, OrderType
            side = OrderSide.BUY if signal_data["action"] == "buy" else OrderSide.SELL
            return [Signal(
                strategy_name=self.metadata.name,
                symbol=market_data.get("symbol", "UNKNOWN"),
                side=side,
                order_type=OrderType.LIMIT,
                entry_price=signal_data["entry"],
                stop_loss=signal_data.get("stop_loss"),
                take_profit=signal_data.get("take_profit"),
                reason=signal_data["reason"]
            )]
        return []
    
    def on_tick(self, tick: Dict) -> Optional[Dict]:
        """Handle tick data."""
        return None
    
    def on_trade_executed(self, trade: Dict) -> None:
        """Handle trade execution."""
        pass
    
    def on_trade_closed(self, trade: Dict) -> None:
        """Handle trade closure."""
        pass
