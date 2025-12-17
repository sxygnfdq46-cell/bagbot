"""Volatility Breakout Strategy - High volatility trading."""

import logging
from typing import Dict, Any, Optional, List

from bagbot.trading.strategy_arsenal import BaseStrategy

logger = logging.getLogger(__name__)


class VolatilityBreakoutStrategy(BaseStrategy):
    """Trades breakouts during high volatility periods."""
    
    def __init__(self, atr_period: int = 14, breakout_multiplier: float = 2.0):
        from bagbot.trading.strategy_arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="VolatilityBreakout",
            description="Volatility breakouts",
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
        self.atr_period = atr_period
        self.breakout_multiplier = breakout_multiplier
        logger.info("💥 Volatility Breakout strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect volatility breakouts."""
        if len(candles) < self.atr_period + 1:
            return None
        
        # Calculate ATR
        atr = self._calculate_atr(candles[-self.atr_period:])
        
        current = candles[-1]
        prev = candles[-2]
        
        # Bullish breakout: close above prev high + ATR
        breakout_level_up = prev["high"] + (atr * self.breakout_multiplier)
        if current["close"] > breakout_level_up:
            return {
                "action": "buy",
                "entry": current["close"],
                "stop_loss": current["close"] - atr,
                "take_profit": current["close"] + (atr * 3),
                "reason": f"Bullish breakout (ATR: {atr:.5f})"
            }
        
        # Bearish breakout: close below prev low - ATR
        breakout_level_down = prev["low"] - (atr * self.breakout_multiplier)
        if current["close"] < breakout_level_down:
            return {
                "action": "sell",
                "entry": current["close"],
                "stop_loss": current["close"] + atr,
                "take_profit": current["close"] - (atr * 3),
                "reason": f"Bearish breakout (ATR: {atr:.5f})"
            }
        
        return None
    
    def _calculate_atr(self, candles: List[Dict]) -> float:
        """Calculate Average True Range."""
        true_ranges = []
        
        for i in range(1, len(candles)):
            high = candles[i]["high"]
            low = candles[i]["low"]
            prev_close = candles[i-1]["close"]
            
            tr = max(
                high - low,
                abs(high - prev_close),
                abs(low - prev_close)
            )
            true_ranges.append(tr)
        
        return sum(true_ranges) / len(true_ranges) if true_ranges else 0.0
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
