"""Supply/Demand Strategy - Zone trading."""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from worker.strategies.arsenal import BaseStrategy

logger = logging.getLogger(__name__)


@dataclass
class Zone:
    """Supply or demand zone."""
    top: float
    bottom: float
    type: str  # "supply" or "demand"
    strength: int = 0
    touched: int = 0


class SupplyDemandStrategy(BaseStrategy):
    """Trades supply and demand zones."""
    
    def __init__(self, zone_strength_min: int = 2):
        from worker.strategies.arsenal import StrategyMetadata, StrategyType, TimeFrame, MarketType
        metadata = StrategyMetadata(
            name="SupplyDemand",
            description="Supply/demand zones",
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
        self.zone_strength_min = zone_strength_min
        self.zones: List[Zone] = []
        logger.info("📦 Supply/Demand strategy initialized")
    
    def analyze(self, candles: List[Dict]) -> Optional[Dict[str, Any]]:
        """Detect supply/demand zones and trade bounces."""
        if len(candles) < 10:
            return None
        
        # Update zones
        self._update_zones(candles)
        
        current = candles[-1]
        current_price = current["close"]
        
        # Check if price entering demand zone
        for zone in self.zones:
            if zone.type == "demand" and zone.bottom <= current_price <= zone.top:
                if zone.strength >= self.zone_strength_min:
                    return {
                        "action": "buy",
                        "entry": current_price,
                        "stop_loss": zone.bottom,
                        "take_profit": zone.top + (zone.top - zone.bottom),
                        "reason": f"Demand zone bounce at {zone.bottom:.5f}"
                    }
            
            # Check if price entering supply zone
            if zone.type == "supply" and zone.bottom <= current_price <= zone.top:
                if zone.strength >= self.zone_strength_min:
                    return {
                        "action": "sell",
                        "entry": current_price,
                        "stop_loss": zone.top,
                        "take_profit": zone.bottom - (zone.top - zone.bottom),
                        "reason": f"Supply zone rejection at {zone.top:.5f}"
                    }
        
        return None
    
    def _update_zones(self, candles: List[Dict]) -> None:
        """Update supply/demand zones from price action."""
        # Simple implementation: look for consolidation areas
        for i in range(len(candles) - 5):
            chunk = candles[i:i+5]
            
            highs = [c["high"] for c in chunk]
            lows = [c["low"] for c in chunk]
            
            range_size = max(highs) - min(lows)
            avg_price = sum(c["close"] for c in chunk) / len(chunk)
            
            # Tight consolidation = potential zone
            if range_size / avg_price < 0.005:  # 0.5% range
                zone = Zone(
                    top=max(highs),
                    bottom=min(lows),
                    type="demand" if chunk[-1]["close"] > chunk[0]["close"] else "supply",
                    strength=len(chunk)
                )
                self.zones.append(zone)
        
        # Keep only recent zones
        if len(self.zones) > 10:
            self.zones = self.zones[-10:]
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
