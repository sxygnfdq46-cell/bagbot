"""Mean Reversion Strategy - Range trading."""

import logging
from typing import Dict, Any, Optional, List

from bagbot.trading.strategy_arsenal import BaseStrategy

logger = logging.getLogger(__name__)


class MeanReversionStrategy(BaseStrategy):
    """Trades oversold/overbought conditions in ranging markets."""
    
    def __init__(self, period: int = 20, std_dev: float = 2.0):
        from bagbot.trading.strategy_arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="MeanReversion",
            description="Mean reversion",
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
        self.period = period
        self.std_dev = std_dev
        logger.info("↔️  Mean Reversion strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect mean reversion setups."""
        if len(candles) < self.period:
            return None
        
        recent = candles[-self.period:]
        closes = [c["close"] for c in recent]
        
        # Calculate mean and std dev
        mean = sum(closes) / len(closes)
        variance = sum((x - mean) ** 2 for x in closes) / len(closes)
        std = variance ** 0.5
        
        current_price = candles[-1]["close"]
        
        # Oversold: price below mean - 2*std
        lower_band = mean - (self.std_dev * std)
        if current_price < lower_band:
            return {
                "action": "buy",
                "entry": current_price,
                "stop_loss": current_price - std,
                "take_profit": mean,
                "reason": f"Oversold at {current_price:.5f} (mean: {mean:.5f})"
            }
        
        # Overbought: price above mean + 2*std
        upper_band = mean + (self.std_dev * std)
        if current_price > upper_band:
            return {
                "action": "sell",
                "entry": current_price,
                "stop_loss": current_price + std,
                "take_profit": mean,
                "reason": f"Overbought at {current_price:.5f} (mean: {mean:.5f})"
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
