"""Breaker Block Strategy - Failed breakout reversals."""

import logging
from typing import Dict, Any, Optional, List

from worker.strategies.arsenal import BaseStrategy

logger = logging.getLogger(__name__)


class BreakerBlockStrategy(BaseStrategy):
    """Trades failed breakouts and market structure breaks."""
    
    def __init__(self, lookback: int = 20):
        from worker.strategies.arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="BreakerBlock",
            description="Breaker Block reversals",
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
        self.lookback = lookback
        logger.info("🔨 Breaker Block strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect breaker blocks."""
        if len(candles) < self.lookback + 2:
            return None
        
        recent = candles[-self.lookback:]
        current = candles[-1]
        
        # Find recent high/low
        recent_high = max(c["high"] for c in recent[:-1])
        recent_low = min(c["low"] for c in recent[:-1])
        
        # Bullish breaker: price breaks below low then reclaims
        if current["close"] > recent_low > recent[-2]["close"]:
            return {
                "action": "buy",
                "entry": current["close"],
                "stop_loss": recent_low,
                "take_profit": recent_high,
                "reason": "Bullish breaker block"
            }
        
        # Bearish breaker: price breaks above high then fails
        if current["close"] < recent_high < recent[-2]["close"]:
            return {
                "action": "sell",
                "entry": current["close"],
                "stop_loss": recent_high,
                "take_profit": recent_low,
                "reason": "Bearish breaker block"
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
