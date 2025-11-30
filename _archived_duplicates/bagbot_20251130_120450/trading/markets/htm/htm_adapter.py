"""
HTM Adapter - High Timeframe Model

Pulls HTF candles from multiple sources and provides confluence 
for OB/FVG strategies. Allows better direction bias.

Sources:
- TradingView (via webhooks)
- Yahoo Finance
- Alpha Vantage
- Custom data providers
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import aiohttp

logger = logging.getLogger(__name__)


class TimeFrame(Enum):
    """High timeframe options."""
    H4 = "4h"
    D1 = "1d"
    W1 = "1w"
    MN = "1M"


class DirectionBias(Enum):
    """Market direction bias."""
    STRONG_BULLISH = "strong_bullish"
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"
    STRONG_BEARISH = "strong_bearish"


@dataclass
class HTFCandle:
    """High timeframe candle."""
    symbol: str
    timeframe: TimeFrame
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: datetime
    
    @property
    def body(self) -> float:
        """Candle body size."""
        return abs(self.close - self.open)
    
    @property
    def is_bullish(self) -> bool:
        """Check if bullish candle."""
        return self.close > self.open
    
    @property
    def upper_wick(self) -> float:
        """Upper wick size."""
        return self.high - max(self.open, self.close)
    
    @property
    def lower_wick(self) -> float:
        """Lower wick size."""
        return min(self.open, self.close) - self.low


@dataclass
class ConfluenceSignal:
    """Multi-timeframe confluence signal."""
    symbol: str
    direction: DirectionBias
    confidence: float  # 0.0 to 1.0
    timeframes: List[TimeFrame]
    reason: str
    timestamp: datetime


class HTMAdapter:
    """
    High Timeframe Model adapter.
    
    Analyzes higher timeframes to provide direction bias for 
    lower timeframe strategies.
    
    Integrates with:
    - Strategy Switcher (direction bias)
    - Micro Trend Follower (trend confirmation)
    - Order Block strategies (confluence)
    """
    
    def __init__(self):
        """Initialize HTM adapter."""
        self.candles: Dict[str, Dict[TimeFrame, List[HTFCandle]]] = {}
        self.data_sources: Dict[str, Dict[str, Any]] = {}
        
        logger.info("📊 HTM Adapter initialized")
    
    def register_source(
        self,
        name: str,
        url: str,
        fetch_function: callable,
        timeframes: List[TimeFrame]
    ) -> None:
        """
        Register data source.
        
        Args:
            name: Source name
            url: API endpoint
            fetch_function: Function to fetch candles
            timeframes: Supported timeframes
        """
        self.data_sources[name] = {
            "url": url,
            "fetch_function": fetch_function,
            "timeframes": timeframes,
            "last_update": None
        }
        
        logger.info(f"✅ Registered HTM source: {name}")
    
    async def fetch_htf_candles(
        self,
        symbol: str,
        timeframe: TimeFrame,
        limit: int = 50
    ) -> List[HTFCandle]:
        """
        Fetch high timeframe candles.
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe
            limit: Number of candles
            
        Returns:
            List of candles
        """
        # Try each data source
        for source_name, config in self.data_sources.items():
            if timeframe in config["timeframes"]:
                try:
                    candles = await config["fetch_function"](
                        symbol=symbol,
                        timeframe=timeframe,
                        limit=limit
                    )
                    
                    # Cache candles
                    if symbol not in self.candles:
                        self.candles[symbol] = {}
                    self.candles[symbol][timeframe] = candles
                    
                    logger.debug(
                        f"✅ Fetched {len(candles)} {timeframe.value} candles "
                        f"for {symbol} from {source_name}"
                    )
                    
                    return candles
                
                except Exception as e:
                    logger.error(f"Failed to fetch from {source_name}: {e}")
        
        return []
    
    def analyze_direction_bias(
        self,
        symbol: str,
        timeframes: Optional[List[TimeFrame]] = None
    ) -> ConfluenceSignal:
        """
        Analyze direction bias across multiple timeframes.
        
        Args:
            symbol: Trading symbol
            timeframes: Timeframes to analyze (default: H4, D1, W1)
            
        Returns:
            Confluence signal
        """
        if timeframes is None:
            timeframes = [TimeFrame.H4, TimeFrame.D1, TimeFrame.W1]
        
        # Get candles for each timeframe
        biases = []
        
        for tf in timeframes:
            if symbol in self.candles and tf in self.candles[symbol]:
                candles = self.candles[symbol][tf]
                
                if candles:
                    # Analyze latest candles
                    bias = self._analyze_timeframe_bias(candles[-10:])
                    biases.append((tf, bias))
        
        # Calculate confluence
        if not biases:
            return ConfluenceSignal(
                symbol=symbol,
                direction=DirectionBias.NEUTRAL,
                confidence=0.0,
                timeframes=[],
                reason="No data available",
                timestamp=datetime.now()
            )
        
        # Aggregate bias
        overall_direction, confidence = self._aggregate_bias(biases)
        
        return ConfluenceSignal(
            symbol=symbol,
            direction=overall_direction,
            confidence=confidence,
            timeframes=[tf for tf, _ in biases],
            reason=f"Confluence from {len(biases)} timeframes",
            timestamp=datetime.now()
        )
    
    def _analyze_timeframe_bias(self, candles: List[HTFCandle]) -> DirectionBias:
        """
        Analyze bias for a single timeframe.
        
        Args:
            candles: List of candles
            
        Returns:
            Direction bias
        """
        if not candles:
            return DirectionBias.NEUTRAL
        
        # Count bullish vs bearish candles
        bullish_count = sum(1 for c in candles if c.is_bullish)
        bearish_count = len(candles) - bullish_count
        
        # Calculate bias score
        bias_score = (bullish_count - bearish_count) / len(candles)
        
        # Determine bias
        if bias_score > 0.6:
            return DirectionBias.STRONG_BULLISH
        elif bias_score > 0.2:
            return DirectionBias.BULLISH
        elif bias_score < -0.6:
            return DirectionBias.STRONG_BEARISH
        elif bias_score < -0.2:
            return DirectionBias.BEARISH
        else:
            return DirectionBias.NEUTRAL
    
    def _aggregate_bias(
        self,
        biases: List[tuple[TimeFrame, DirectionBias]]
    ) -> tuple[DirectionBias, float]:
        """
        Aggregate biases from multiple timeframes.
        
        Args:
            biases: List of (timeframe, bias) tuples
            
        Returns:
            (overall_direction, confidence)
        """
        # Convert biases to scores
        bias_scores = {
            DirectionBias.STRONG_BEARISH: -2,
            DirectionBias.BEARISH: -1,
            DirectionBias.NEUTRAL: 0,
            DirectionBias.BULLISH: 1,
            DirectionBias.STRONG_BULLISH: 2
        }
        
        # Calculate weighted average (higher timeframes have more weight)
        weights = {
            TimeFrame.H4: 1.0,
            TimeFrame.D1: 1.5,
            TimeFrame.W1: 2.0,
            TimeFrame.MN: 2.5
        }
        
        total_score = 0.0
        total_weight = 0.0
        
        for tf, bias in biases:
            weight = weights.get(tf, 1.0)
            score = bias_scores[bias]
            
            total_score += score * weight
            total_weight += weight
        
        avg_score = total_score / total_weight if total_weight > 0 else 0
        
        # Determine direction
        if avg_score > 1.5:
            direction = DirectionBias.STRONG_BULLISH
        elif avg_score > 0.5:
            direction = DirectionBias.BULLISH
        elif avg_score < -1.5:
            direction = DirectionBias.STRONG_BEARISH
        elif avg_score < -0.5:
            direction = DirectionBias.BEARISH
        else:
            direction = DirectionBias.NEUTRAL
        
        # Calculate confidence (based on agreement)
        confidence = min(1.0, abs(avg_score) / 2.0)
        
        return direction, confidence
    
    def get_status(self) -> Dict[str, Any]:
        """Get HTM adapter status."""
        return {
            "symbols_tracked": len(self.candles),
            "data_sources": len(self.data_sources),
            "total_candles": sum(
                len(candles)
                for symbol_data in self.candles.values()
                for candles in symbol_data.values()
            )
        }


# Example fetch function for TradingView
async def fetch_from_tradingview(
    symbol: str,
    timeframe: TimeFrame,
    limit: int
) -> List[HTFCandle]:
    """Fetch candles from TradingView (via webhook or API)."""
    # Placeholder implementation
    # In real implementation, would call TradingView API
    return []


# Example fetch function for Yahoo Finance
async def fetch_from_yahoo(
    symbol: str,
    timeframe: TimeFrame,
    limit: int
) -> List[HTFCandle]:
    """Fetch candles from Yahoo Finance."""
    # Placeholder implementation
    return []
