"""Trend Continuation Strategy - Momentum trading."""

import logging
from typing import Dict, Any, Optional, List

from bagbot.trading.strategy_arsenal import BaseStrategy

logger = logging.getLogger(__name__)


class TrendContinuationStrategy(BaseStrategy):
    """Trades pullbacks in strong trends."""
    
    def __init__(self, trend_period: int = 50, pullback_percent: float = 0.382):
        from bagbot.trading.strategy_arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="TrendContinuation",
            description="Trend continuation",
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
        self.trend_period = trend_period
        self.pullback_percent = pullback_percent
        logger.info("📈 Trend Continuation strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect trend continuation setups."""
        if len(candles) < self.trend_period:
            return None
        
        # Determine trend
        recent = candles[-self.trend_period:]
        closes = [c["close"] for c in recent]
        
        trend_start = closes[0]
        trend_end = closes[-1]
        trend_direction = "up" if trend_end > trend_start else "down"
        
        # Calculate trend strength
        trend_strength = abs(trend_end - trend_start) / trend_start
        
        # Need strong trend (>5% move)
        if trend_strength < 0.05:
            return None
        
        # Check for pullback
        current = candles[-1]
        recent_high = max(c["high"] for c in candles[-10:])
        recent_low = min(c["low"] for c in candles[-10:])
        
        if trend_direction == "up":
            # Bullish trend, look for pullback
            pullback_level = recent_high - ((recent_high - recent_low) * self.pullback_percent)
            
            if current["close"] <= pullback_level < candles[-2]["close"]:
                return {
                    "action": "buy",
                    "entry": current["close"],
                    "stop_loss": recent_low,
                    "take_profit": recent_high + (recent_high - recent_low),
                    "reason": f"Bullish continuation pullback to {pullback_level:.5f}"
                }
        
        else:  # Downtrend
            # Bearish trend, look for pullback
            pullback_level = recent_low + ((recent_high - recent_low) * self.pullback_percent)
            
            if current["close"] >= pullback_level > candles[-2]["close"]:
                return {
                    "action": "sell",
                    "entry": current["close"],
                    "stop_loss": recent_high,
                    "take_profit": recent_low - (recent_high - recent_low),
                    "reason": f"Bearish continuation pullback to {pullback_level:.5f}"
                }
        
        return None
    def generate_signals(self, market_data: Dict, account: Dict) -> List:
        """Generate signals from market data."""
        candles = market_data.get("candles", [])
        signal_data = self.analyze(candles)
        if signal_data:
            from bagbot.trading.strategy_arsenal import Signal, OrderSide, OrderType
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
            from bagbot.trading.strategy_arsenal import Signal, OrderSide, OrderType
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
