"""FVG Strategy - Fair Value Gap trading."""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from worker.strategies.arsenal import BaseStrategy

logger = logging.getLogger(__name__)


@dataclass
class FairValueGap:
    """Fair value gap zone."""
    upper: float
    lower: float
    direction: str  # "bullish" or "bearish"
    filled: bool = False


class FVGStrategy(BaseStrategy):
    """Fair Value Gap strategy - trades imbalances."""
    
    def __init__(self, min_gap_size: float = 0.0005):
        from worker.strategies.arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="FVG",
            description="Fair Value Gap trading",
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
        self.min_gap_size = min_gap_size
        self.active_gaps: List[FairValueGap] = []
        logger.info("📊 FVG strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect and trade FVGs."""
        if len(candles) < 3:
            return None
        
        # Detect 3-candle FVG
        c1, c2, c3 = candles[-3], candles[-2], candles[-1]
        
        # Bullish FVG: c1.high < c3.low
        if c1["high"] < c3["low"]:
            gap_size = c3["low"] - c1["high"]
            if gap_size / c1["high"] > self.min_gap_size:
                return {
                    "action": "buy",
                    "entry": c1["high"],
                    "stop_loss": c1["low"],
                    "take_profit": c1["high"] + gap_size * 2,
                    "reason": f"Bullish FVG {gap_size:.5f}"
                }
        
        # Bearish FVG: c1.low > c3.high
        if c1["low"] > c3["high"]:
            gap_size = c1["low"] - c3["high"]
            if gap_size / c1["low"] > self.min_gap_size:
                return {
                    "action": "sell",
                    "entry": c1["low"],
                    "stop_loss": c1["high"],
                    "take_profit": c1["low"] - gap_size * 2,
                    "reason": f"Bearish FVG {gap_size:.5f}"
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
