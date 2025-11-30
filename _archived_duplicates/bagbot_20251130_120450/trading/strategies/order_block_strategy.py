"""
Order Block Strategy - Smart Money Tracking

Identifies institutional order blocks and trades with smart money flow.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass

from bagbot.trading.strategy_arsenal import BaseStrategy

logger = logging.getLogger(__name__)


@dataclass
class OrderBlock:
    """Order block zone."""
    high: float
    low: float
    direction: str  # "bullish" or "bearish"
    timestamp: datetime
    strength: float  # 0.0 to 1.0
    tested: int  # Number of times tested


class OrderBlockStrategy(BaseStrategy):
    """
    Order Block trading strategy.
    
    Finds institutional order blocks (OB) and fair value gaps (FVG)
    to trade alongside smart money.
    
    Logic:
    1. Identify strong momentum candles (engulfing, marubozu)
    2. Mark the base candle as order block
    3. Wait for price to return to block
    4. Enter on confirmation with tight stop
    """
    
    def __init__(
        self,
        min_block_strength: float = 0.7,
        max_block_age_bars: int = 20,
        confirmation_required: bool = True
    ):
        """Initialize strategy."""
        super().__init__(name="OrderBlock")
        
        self.min_block_strength = min_block_strength
        self.max_block_age_bars = max_block_age_bars
        self.confirmation_required = confirmation_required
        
        self.active_blocks: List[OrderBlock] = []
        
        logger.info("📦 Order Block strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Analyze for order block setup."""
        if len(candles) < 5:
            return None
        
        # Detect order blocks
        self._detect_order_blocks(candles)
        
        # Check for price returning to block
        current_price = candles[-1]["close"]
        
        for block in self.active_blocks:
            if self._is_price_in_block(current_price, block):
                if block.direction == "bullish":
                    return {
                        "action": "buy",
                        "entry": block.high,
                        "stop_loss": block.low,
                        "take_profit": block.high + (block.high - block.low) * 2,
                        "reason": f"Bullish OB at {block.low:.5f}"
                    }
                else:
                    return {
                        "action": "sell",
                        "entry": block.low,
                        "stop_loss": block.high,
                        "take_profit": block.low - (block.high - block.low) * 2,
                        "reason": f"Bearish OB at {block.high:.5f}"
                    }
        
        return None
    
    def _detect_order_blocks(self, candles: List[Dict]) -> None:
        """Detect order blocks from price action."""
        # Look for strong momentum candles
        for i in range(len(candles) - 3):
            candle = candles[i]
            
            # Check for engulfing pattern
            body_size = abs(candle["close"] - candle["open"])
            candle_range = candle["high"] - candle["low"]
            
            if body_size / candle_range > 0.7:  # Strong candle
                if candle["close"] > candle["open"]:
                    # Bullish order block
                    block = OrderBlock(
                        high=candle["high"],
                        low=candle["low"],
                        direction="bullish",
                        timestamp=candle["timestamp"],
                        strength=body_size / candle_range,
                        tested=0
                    )
                    self.active_blocks.append(block)
                else:
                    # Bearish order block
                    block = OrderBlock(
                        high=candle["high"],
                        low=candle["low"],
                        direction="bearish",
                        timestamp=candle["timestamp"],
                        strength=body_size / candle_range,
                        tested=0
                    )
                    self.active_blocks.append(block)
    
    def _is_price_in_block(self, price: float, block: OrderBlock) -> bool:
        """Check if price is in block zone."""
        return block.low <= price <= block.high
