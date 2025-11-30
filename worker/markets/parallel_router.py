"""
Parallel Market Router - Upgraded multi-market trading coordinator.

Routes price streams to correct strategies, enforces market rules,
tracks per-market performance, and triggers per-market emergency stops.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
from collections import defaultdict

from worker.markets.market_adapter import (
    MarketAdapter,
    MarketType,
    Price,
    Order,
    OrderSide,
    OrderType,
    Position,
    AccountInfo
)

logger = logging.getLogger(__name__)


class MarketPipeline:
    """Single market execution pipeline."""
    
    def __init__(self, adapter: MarketAdapter):
        """
        Initialize pipeline.
        
        Args:
            adapter: Market adapter
        """
        self.adapter = adapter
        self.market_type = adapter.get_market_type()
        self.name = adapter.get_name()
        
        # Performance tracking
        self.total_trades = 0
        self.winning_trades = 0
        self.total_pnl = 0.0
        
        # Emergency state
        self.emergency_stop = False
        self.stop_reason = ""
        
        # Rate limiting
        self.last_order_time: Optional[datetime] = None
        self.orders_this_minute = 0
        self.minute_reset_time = datetime.now()
        
        logger.info(f"🔧 Market pipeline created: {self.name}")
    
    async def process_price(
        self,
        price: Price,
        strategy_signals: Dict[str, Any]
    ) -> Optional[Order]:
        """
        Process price update and strategy signals.
        
        Args:
            price: Current price
            strategy_signals: Signals from strategies
            
        Returns:
            Created order if any
        """
        # Check emergency stop
        if self.emergency_stop:
            logger.warning(
                f"🛑 {self.name} emergency stop active: {self.stop_reason}"
            )
            return None
        
        # Rate limit check
        if not self._check_rate_limit():
            logger.warning(f"⏱️  {self.name} rate limit exceeded")
            return None
        
        # Process signals
        # This is where strategy logic would execute
        # For now, just log
        logger.debug(f"📊 {self.name} price: {price.symbol} @ {price.bid}/{price.ask}")
        
        return None
    
    def record_trade_result(self, pnl: float) -> None:
        """
        Record trade result.
        
        Args:
            pnl: Profit/loss
        """
        self.total_trades += 1
        self.total_pnl += pnl
        
        if pnl > 0:
            self.winning_trades += 1
        
        logger.info(
            f"📈 {self.name} trade: PnL ${pnl:.2f} "
            f"(Total: {self.total_trades}, Win Rate: {self.get_win_rate():.1%})"
        )
    
    def trigger_emergency_stop(self, reason: str) -> None:
        """
        Trigger emergency stop for this market.
        
        Args:
            reason: Reason for stop
        """
        self.emergency_stop = True
        self.stop_reason = reason
        
        logger.error(f"🚨 {self.name} EMERGENCY STOP: {reason}")
    
    def release_emergency_stop(self) -> None:
        """Release emergency stop."""
        self.emergency_stop = False
        self.stop_reason = ""
        
        logger.info(f"✅ {self.name} emergency stop released")
    
    def get_win_rate(self) -> float:
        """Get win rate."""
        if self.total_trades == 0:
            return 0.0
        return self.winning_trades / self.total_trades
    
    def _check_rate_limit(self) -> bool:
        """
        Check rate limit.
        
        Returns:
            True if under limit
        """
        now = datetime.now()
        
        # Reset minute counter
        if (now - self.minute_reset_time).total_seconds() >= 60:
            self.orders_this_minute = 0
            self.minute_reset_time = now
        
        # Check limit (20 orders per minute per market)
        if self.orders_this_minute >= 20:
            return False
        
        self.orders_this_minute += 1
        self.last_order_time = now
        
        return True
    
    def get_health_score(self) -> float:
        """
        Get pipeline health score (0.0 to 1.0).
        
        Returns:
            Health score
        """
        if self.emergency_stop:
            return 0.0
        
        if self.total_trades == 0:
            return 1.0
        
        # Based on win rate and PnL
        win_rate = self.get_win_rate()
        pnl_health = min(1.0, max(0.0, (self.total_pnl / 1000.0) + 0.5))
        
        return (win_rate * 0.7) + (pnl_health * 0.3)


class ParallelMarketRouter:
    """
    Parallel multi-market trading coordinator.
    
    Manages multiple market pipelines running in parallel:
    - Crypto (Binance)
    - Forex (MT5)
    - Stocks (Alpaca)
    
    Each market has its own:
    - Connection
    - Order routing
    - Performance tracking
    - Emergency stop mechanism
    """
    
    def __init__(self):
        """Initialize router."""
        self.pipelines: Dict[str, MarketPipeline] = {}
        self.adapters: Dict[str, MarketAdapter] = {}
        self.running = False
        
        # Global controls
        self.global_emergency_stop = False
        
        logger.info("🌍 ParallelMarketRouter initialized")
    
    def register_adapter(self, adapter: MarketAdapter) -> None:
        """
        Register a market adapter.
        
        Args:
            adapter: Market adapter to register
        """
        name = adapter.get_name()
        
        self.adapters[name] = adapter
        self.pipelines[name] = MarketPipeline(adapter)
        
        logger.info(f"✅ Registered adapter: {name} ({adapter.get_market_type().value})")
    
    async def start(self) -> None:
        """Start all market pipelines."""
        if self.running:
            logger.warning("Router already running")
            return
        
        logger.info("🚀 Starting market pipelines...")
        
        # Connect all adapters in parallel
        connect_tasks = [
            adapter.connect()
            for adapter in self.adapters.values()
        ]
        
        results = await asyncio.gather(*connect_tasks, return_exceptions=True)
        
        # Check results
        for adapter_name, result in zip(self.adapters.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Failed to connect {adapter_name}: {result}")
            elif result:
                logger.info(f"✅ {adapter_name} connected")
            else:
                logger.error(f"Failed to connect {adapter_name}")
        
        self.running = True
        logger.info("✅ All pipelines started")
    
    async def stop(self) -> None:
        """Stop all market pipelines."""
        if not self.running:
            return
        
        logger.info("🛑 Stopping market pipelines...")
        
        # Disconnect all adapters in parallel
        disconnect_tasks = [
            adapter.disconnect()
            for adapter in self.adapters.values()
        ]
        
        await asyncio.gather(*disconnect_tasks, return_exceptions=True)
        
        self.running = False
        logger.info("✅ All pipelines stopped")
    
    async def route_price(
        self,
        market_name: str,
        price: Price,
        strategy_signals: Dict[str, Any]
    ) -> Optional[Order]:
        """
        Route price to appropriate market pipeline.
        
        Args:
            market_name: Name of market adapter
            price: Price data
            strategy_signals: Signals from strategies
            
        Returns:
            Created order if any
        """
        # Check global emergency stop
        if self.global_emergency_stop:
            logger.warning("🚨 Global emergency stop active")
            return None
        
        # Get pipeline
        pipeline = self.pipelines.get(market_name)
        if not pipeline:
            logger.error(f"Unknown market: {market_name}")
            return None
        
        # Process through pipeline
        return await pipeline.process_price(price, strategy_signals)
    
    async def create_order(
        self,
        market_name: str,
        symbol: str,
        side: OrderSide,
        quantity: float,
        order_type: OrderType = OrderType.MARKET,
        **kwargs
    ) -> Optional[Order]:
        """
        Create order on specific market.
        
        Args:
            market_name: Name of market adapter
            symbol: Trading symbol
            side: Buy or sell
            quantity: Order quantity
            order_type: Type of order
            **kwargs: Additional parameters
            
        Returns:
            Created order or None
        """
        adapter = self.adapters.get(market_name)
        if not adapter:
            logger.error(f"Unknown market: {market_name}")
            return None
        
        pipeline = self.pipelines[market_name]
        if pipeline.emergency_stop:
            logger.warning(
                f"🛑 {market_name} emergency stop active: {pipeline.stop_reason}"
            )
            return None
        
        try:
            order = await adapter.create_order(
                symbol=symbol,
                side=side,
                quantity=quantity,
                order_type=order_type,
                **kwargs
            )
            
            logger.info(
                f"📝 Order created on {market_name}: "
                f"{side.value} {quantity} {symbol}"
            )
            
            return order
        
        except Exception as e:
            logger.error(f"Failed to create order on {market_name}: {e}")
            return None
    
    async def get_all_positions(self) -> Dict[str, List[Position]]:
        """
        Get positions from all markets.
        
        Returns:
            Dict of market name -> positions
        """
        result = {}
        
        tasks = {
            name: adapter.get_open_positions()
            for name, adapter in self.adapters.items()
        }
        
        positions = await asyncio.gather(
            *tasks.values(),
            return_exceptions=True
        )
        
        for name, pos in zip(tasks.keys(), positions):
            if isinstance(pos, Exception):
                logger.error(f"Failed to get positions from {name}: {pos}")
                result[name] = []
            else:
                result[name] = pos
        
        return result
    
    async def get_all_account_info(self) -> Dict[str, AccountInfo]:
        """
        Get account info from all markets.
        
        Returns:
            Dict of market name -> account info
        """
        result = {}
        
        tasks = {
            name: adapter.get_account_info()
            for name, adapter in self.adapters.items()
        }
        
        accounts = await asyncio.gather(
            *tasks.values(),
            return_exceptions=True
        )
        
        for name, acc in zip(tasks.keys(), accounts):
            if isinstance(acc, Exception):
                logger.error(f"Failed to get account info from {name}: {acc}")
            else:
                result[name] = acc
        
        return result
    
    def trigger_market_stop(self, market_name: str, reason: str) -> None:
        """
        Trigger emergency stop for specific market.
        
        Args:
            market_name: Name of market
            reason: Reason for stop
        """
        pipeline = self.pipelines.get(market_name)
        if pipeline:
            pipeline.trigger_emergency_stop(reason)
    
    def trigger_global_stop(self, reason: str) -> None:
        """
        Trigger global emergency stop.
        
        Args:
            reason: Reason for stop
        """
        self.global_emergency_stop = True
        
        # Stop all pipelines
        for pipeline in self.pipelines.values():
            pipeline.trigger_emergency_stop(f"Global stop: {reason}")
        
        logger.error(f"🚨 GLOBAL EMERGENCY STOP: {reason}")
    
    def release_global_stop(self) -> None:
        """Release global emergency stop."""
        self.global_emergency_stop = False
        
        # Release all pipelines
        for pipeline in self.pipelines.values():
            pipeline.release_emergency_stop()
        
        logger.info("✅ Global emergency stop released")
    
    def get_market_performance(self) -> Dict[str, Dict[str, Any]]:
        """
        Get performance stats for all markets.
        
        Returns:
            Dict of market name -> performance stats
        """
        result = {}
        
        for name, pipeline in self.pipelines.items():
            result[name] = {
                "total_trades": pipeline.total_trades,
                "winning_trades": pipeline.winning_trades,
                "total_pnl": pipeline.total_pnl,
                "win_rate": pipeline.get_win_rate(),
                "health_score": pipeline.get_health_score(),
                "emergency_stop": pipeline.emergency_stop,
                "stop_reason": pipeline.stop_reason
            }
        
        return result
    
    def get_status(self) -> Dict[str, Any]:
        """Get router status."""
        return {
            "running": self.running,
            "global_emergency_stop": self.global_emergency_stop,
            "markets": list(self.adapters.keys()),
            "performance": self.get_market_performance()
        }
