"""
Micro Trend Follower Strategy

Ultra-fast trend-following strategy that:
- Watches candles in real-time (millisecond resolution)
- Goes long if candle ticks up
- Instantly flips short if candle reverses
- No emotion, instant reaction
- Constant position alignment with candle direction
- Tight stop protection
- Spread/slippage compensation
- Order throttling for rate limits
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import deque

from bagbot.trading.strategy_arsenal import (
    BaseStrategy,
    StrategyMetadata,
    StrategyConfig,
    Signal,
    StrategyType,
    TimeFrame,
    MarketType
)

logger = logging.getLogger(__name__)


class MicroTrendFollower(BaseStrategy):
    """
    Micro Trend Follower - Ultra-responsive tick-based strategy.
    
    Philosophy:
    "I am the shadow of the candle. Where it goes, I follow instantly.
    Up? I buy. Down? I sell. No hesitation, no fear, only precision."
    """
    
    def __init__(self, config: Optional[StrategyConfig] = None):
        """Initialize Micro Trend Follower strategy."""
        
        # Define metadata
        metadata = StrategyMetadata(
            name="MicroTrendFollower",
            description="Ultra-fast tick-based trend follower with instant reversal capability",
            version="1.0.0",
            author="BAGBOT2",
            strategy_type=StrategyType.TREND_FOLLOWING,
            timeframe=TimeFrame.TICK,
            markets=[MarketType.CRYPTO, MarketType.FOREX],
            risk_level=4,  # High risk due to high frequency
            min_capital=100.0,
            max_position_size=1000.0,
            default_stop_loss_percent=0.5,  # Tight stops
            default_take_profit_percent=1.0,  # Quick profits
            requires_data=["tick_data", "order_book"],
            tags=["scalping", "high_frequency", "trend_following", "tick_based"]
        )
        
        # Default config for micro trading
        if config is None:
            config = StrategyConfig(
                enabled=True,
                position_size_percent=0.5,  # Small positions
                max_concurrent_trades=1,  # One position at a time
                stop_loss_percent=0.5,
                take_profit_percent=1.0,
                trailing_stop=True,
                trailing_stop_percent=0.3,
                custom_params={
                    "tick_threshold": 0.0001,  # Min price move to trigger
                    "reversal_threshold": 0.0002,  # Price move to flip position
                    "order_cooldown_ms": 100,  # Min time between orders
                    "spread_compensation": True,
                    "slippage_buffer": 0.0001,
                    "momentum_window": 10,  # Ticks to measure momentum
                    "volatility_filter": True,
                    "max_orders_per_minute": 20
                }
            )
        
        super().__init__(metadata, config)
        
        # State tracking
        self.last_price: Optional[float] = None
        self.current_position: Optional[str] = None  # 'long', 'short', or None
        self.position_entry_price: Optional[float] = None
        self.last_order_time: Optional[datetime] = None
        self.tick_history = deque(maxlen=config.custom_params.get("momentum_window", 10))
        self.order_count_this_minute = 0
        self.minute_start = datetime.now()
        
        # Performance tracking
        self.total_ticks_processed = 0
        self.signals_generated = 0
        self.reversals_count = 0
        
        logger.info(
            f"🚀 MicroTrendFollower initialized: "
            f"tick_threshold={config.custom_params['tick_threshold']}, "
            f"reversal_threshold={config.custom_params['reversal_threshold']}"
        )
    
    def generate_signals(
        self,
        market_data: Dict[str, Any],
        account: Dict[str, Any]
    ) -> List[Signal]:
        """
        Generate signals (not used for tick-based strategy).
        Use on_tick() instead for real-time operation.
        """
        # This strategy operates on ticks, not traditional signals
        return []
    
    def on_tick(self, tick: Dict[str, Any]) -> Optional[Signal]:
        """
        Handle real-time tick data and generate instant signals.
        
        Args:
            tick: {
                'symbol': str,
                'price': float,
                'volume': float,
                'timestamp': str,
                'bid': float (optional),
                'ask': float (optional)
            }
            
        Returns:
            Signal if action needed, None otherwise
        """
        self.total_ticks_processed += 1
        
        symbol = tick.get("symbol")
        price = tick.get("price")
        timestamp = tick.get("timestamp", datetime.now().isoformat())
        
        if price is None:
            return None
        
        # Initialize last price
        if self.last_price is None:
            self.last_price = price
            self.tick_history.append(price)
            return None
        
        # Check order throttling
        if not self._can_send_order():
            return None
        
        # Calculate price change
        price_change = price - self.last_price
        price_change_percent = (price_change / self.last_price) * 100
        
        # Add to tick history
        self.tick_history.append(price)
        
        # Calculate momentum
        momentum = self._calculate_momentum()
        
        # Determine action
        signal = None
        
        # Get thresholds from config
        tick_threshold = self.config.custom_params.get("tick_threshold", 0.0001)
        reversal_threshold = self.config.custom_params.get("reversal_threshold", 0.0002)
        
        # Apply spread compensation if enabled
        if self.config.custom_params.get("spread_compensation", True):
            spread = tick.get("ask", price) - tick.get("bid", price)
            if spread > 0:
                tick_threshold += spread / 2
                reversal_threshold += spread / 2
        
        # Check volatility filter
        if self.config.custom_params.get("volatility_filter", True):
            if not self._check_volatility():
                return None
        
        # Case 1: No position - enter based on trend
        if self.current_position is None:
            if price_change_percent > tick_threshold and momentum > 0:
                # Upward tick - go long
                signal = self._create_signal(
                    symbol=symbol,
                    side="buy",
                    price=price,
                    reason=f"Micro uptrend detected: +{price_change_percent:.4f}%, momentum={momentum:.2f}",
                    strength=min(abs(price_change_percent) * 100, 1.0),
                    timestamp=timestamp
                )
                self.current_position = "long"
                self.position_entry_price = price
                
            elif price_change_percent < -tick_threshold and momentum < 0:
                # Downward tick - go short
                signal = self._create_signal(
                    symbol=symbol,
                    side="sell",
                    price=price,
                    reason=f"Micro downtrend detected: {price_change_percent:.4f}%, momentum={momentum:.2f}",
                    strength=min(abs(price_change_percent) * 100, 1.0),
                    timestamp=timestamp
                )
                self.current_position = "short"
                self.position_entry_price = price
        
        # Case 2: Have long position
        elif self.current_position == "long":
            # Check if should reverse to short
            if price_change_percent < -reversal_threshold and momentum < 0:
                signal = self._create_signal(
                    symbol=symbol,
                    side="sell",
                    price=price,
                    reason=f"Reversal to short: {price_change_percent:.4f}%, momentum={momentum:.2f}",
                    strength=min(abs(price_change_percent) * 100, 1.0),
                    timestamp=timestamp
                )
                self.current_position = "short"
                self.position_entry_price = price
                self.reversals_count += 1
            
            # Check stop loss
            elif self.position_entry_price:
                loss_percent = ((price - self.position_entry_price) / self.position_entry_price) * 100
                if loss_percent < -self.config.stop_loss_percent:
                    signal = self._create_signal(
                        symbol=symbol,
                        side="sell",
                        price=price,
                        reason=f"Stop loss hit: {loss_percent:.2f}%",
                        strength=1.0,
                        timestamp=timestamp
                    )
                    self.current_position = None
                    self.position_entry_price = None
        
        # Case 3: Have short position
        elif self.current_position == "short":
            # Check if should reverse to long
            if price_change_percent > reversal_threshold and momentum > 0:
                signal = self._create_signal(
                    symbol=symbol,
                    side="buy",
                    price=price,
                    reason=f"Reversal to long: +{price_change_percent:.4f}%, momentum={momentum:.2f}",
                    strength=min(abs(price_change_percent) * 100, 1.0),
                    timestamp=timestamp
                )
                self.current_position = "long"
                self.position_entry_price = price
                self.reversals_count += 1
            
            # Check stop loss
            elif self.position_entry_price:
                loss_percent = ((self.position_entry_price - price) / self.position_entry_price) * 100
                if loss_percent < -self.config.stop_loss_percent:
                    signal = self._create_signal(
                        symbol=symbol,
                        side="buy",
                        price=price,
                        reason=f"Stop loss hit: {loss_percent:.2f}%",
                        strength=1.0,
                        timestamp=timestamp
                    )
                    self.current_position = None
                    self.position_entry_price = None
        
        # Update last price
        self.last_price = price
        
        # Track signal generation
        if signal:
            self.signals_generated += 1
            self.last_order_time = datetime.now()
            self.order_count_this_minute += 1
            
            logger.info(
                f"⚡ {signal.side.upper()} signal: {symbol} @ ${price:.4f} | "
                f"Position: {self.current_position} | "
                f"Reason: {signal.reason}"
            )
        
        return signal
    
    def on_trade_executed(self, trade: Dict[str, Any]) -> None:
        """React to trade execution."""
        logger.info(
            f"✅ Trade executed: {trade.get('side')} {trade.get('symbol')} "
            f"@ ${trade.get('price'):.4f}"
        )
    
    def on_trade_closed(self, trade: Dict[str, Any], profit: float) -> None:
        """React to trade closure."""
        profit_percent = (profit / trade.get("entry_price", 1)) * 100 if trade.get("entry_price") else 0
        
        logger.info(
            f"🏁 Trade closed: {trade.get('symbol')} | "
            f"P&L: ${profit:.2f} ({profit_percent:+.2f}%)"
        )
        
        # Reset position tracking if this was our position
        if self.current_position:
            self.current_position = None
            self.position_entry_price = None
    
    def _create_signal(
        self,
        symbol: str,
        side: str,
        price: float,
        reason: str,
        strength: float,
        timestamp: str
    ) -> Signal:
        """Create a trading signal with proper stop loss and take profit."""
        
        # Calculate stop loss and take profit
        if side == "buy":
            stop_loss = price * (1 - self.config.stop_loss_percent / 100)
            take_profit = price * (1 + self.config.take_profit_percent / 100)
        else:
            stop_loss = price * (1 + self.config.stop_loss_percent / 100)
            take_profit = price * (1 - self.config.take_profit_percent / 100)
        
        # Apply slippage buffer if configured
        slippage_buffer = self.config.custom_params.get("slippage_buffer", 0.0)
        if slippage_buffer > 0:
            if side == "buy":
                price += slippage_buffer
            else:
                price -= slippage_buffer
        
        return Signal(
            strategy_name=self.metadata.name,
            symbol=symbol,
            side=side,
            strength=strength,
            entry_price=price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            timeframe=self.metadata.timeframe.value,
            reason=reason,
            timestamp=timestamp,
            metadata={
                "position": self.current_position,
                "reversals_count": self.reversals_count,
                "total_ticks": self.total_ticks_processed
            }
        )
    
    def _calculate_momentum(self) -> float:
        """Calculate momentum from tick history."""
        if len(self.tick_history) < 2:
            return 0.0
        
        # Simple momentum: ratio of up-ticks to total ticks
        up_ticks = 0
        for i in range(1, len(self.tick_history)):
            if self.tick_history[i] > self.tick_history[i-1]:
                up_ticks += 1
        
        momentum = (up_ticks / (len(self.tick_history) - 1)) - 0.5  # Center around 0
        return momentum * 2  # Scale to -1 to 1
    
    def _check_volatility(self) -> bool:
        """Check if volatility is within acceptable range."""
        if len(self.tick_history) < 3:
            return True
        
        # Calculate recent price range
        recent_prices = list(self.tick_history)[-5:]
        price_range = max(recent_prices) - min(recent_prices)
        avg_price = sum(recent_prices) / len(recent_prices)
        
        volatility = (price_range / avg_price) * 100
        
        # Only trade if volatility is reasonable (not too high, not too low)
        return 0.01 < volatility < 2.0
    
    def _can_send_order(self) -> bool:
        """Check if we can send an order based on throttling rules."""
        now = datetime.now()
        
        # Reset minute counter
        if (now - self.minute_start).total_seconds() >= 60:
            self.minute_start = now
            self.order_count_this_minute = 0
        
        # Check max orders per minute
        max_orders = self.config.custom_params.get("max_orders_per_minute", 20)
        if self.order_count_this_minute >= max_orders:
            return False
        
        # Check cooldown
        if self.last_order_time:
            cooldown_ms = self.config.custom_params.get("order_cooldown_ms", 100)
            elapsed_ms = (now - self.last_order_time).total_seconds() * 1000
            if elapsed_ms < cooldown_ms:
                return False
        
        return True
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get strategy statistics."""
        return {
            "total_ticks_processed": self.total_ticks_processed,
            "signals_generated": self.signals_generated,
            "reversals_count": self.reversals_count,
            "current_position": self.current_position,
            "order_count_this_minute": self.order_count_this_minute,
            "signal_rate": (
                self.signals_generated / self.total_ticks_processed * 100
                if self.total_ticks_processed > 0 else 0
            )
        }
