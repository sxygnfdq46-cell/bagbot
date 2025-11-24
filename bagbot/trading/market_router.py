"""
Multi-Market Support Framework

Provides abstraction layer for trading across different markets:
- Crypto (Binance, Coinbase, etc.)
- Forex (MT5, OANDA, etc.)
- Stocks (Alpaca, Interactive Brokers, etc.)
- Futures
- Options

Each market has its own connector, but they all implement the same interface.
"""

import logging
from typing import Dict, Any, List, Optional, Protocol
from abc import ABC, abstractmethod
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


class MarketType(Enum):
    """Supported market types."""
    CRYPTO = "crypto"
    FOREX = "forex"
    STOCKS = "stocks"
    FUTURES = "futures"
    OPTIONS = "options"


class OrderType(Enum):
    """Order types."""
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class OrderSide(Enum):
    """Order sides."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(Enum):
    """Order status."""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELED = "canceled"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class MarketInfo:
    """Market information."""
    market_type: MarketType
    symbol: str
    base_currency: str
    quote_currency: str
    min_order_size: float
    max_order_size: float
    price_precision: int
    quantity_precision: int
    tick_size: float
    trading_fees: float  # Percentage
    market_hours: str  # e.g., "24/7" or "9:30-16:00 EST"
    leverage_available: bool
    max_leverage: float


@dataclass
class OrderRequest:
    """Order request."""
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    time_in_force: str = "GTC"  # GTC, IOC, FOK
    client_order_id: Optional[str] = None
    metadata: Dict[str, Any] = None


@dataclass
class Order:
    """Order object."""
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    filled_quantity: float
    price: Optional[float]
    avg_fill_price: Optional[float]
    status: OrderStatus
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]


@dataclass
class Position:
    """Position object."""
    symbol: str
    side: str  # 'long' or 'short'
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    market_value: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    metadata: Dict[str, Any] = None


@dataclass
class AccountInfo:
    """Account information."""
    account_id: str
    balance: float
    equity: float
    margin_used: float
    margin_available: float
    currency: str
    buying_power: float
    positions_count: int
    open_orders_count: int


class MarketConnector(ABC):
    """
    Abstract base class for market connectors.
    
    All market connectors must implement these methods to provide
    a unified interface regardless of the underlying market/broker.
    """
    
    def __init__(self, market_type: MarketType, config: Dict[str, Any]):
        """Initialize connector."""
        self.market_type = market_type
        self.config = config
        self.is_connected = False
        
        logger.info(f"🔌 Initializing {market_type.value} connector")
    
    @abstractmethod
    async def connect(self) -> bool:
        """
        Connect to the market/broker.
        
        Returns:
            True if connected successfully
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the market/broker."""
        pass
    
    @abstractmethod
    async def get_account_info(self) -> AccountInfo:
        """Get account information."""
        pass
    
    @abstractmethod
    async def get_market_info(self, symbol: str) -> MarketInfo:
        """Get market information for a symbol."""
        pass
    
    @abstractmethod
    async def get_current_price(self, symbol: str) -> float:
        """Get current market price for a symbol."""
        pass
    
    @abstractmethod
    async def place_order(self, order_request: OrderRequest) -> Order:
        """Place a new order."""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an existing order."""
        pass
    
    @abstractmethod
    async def get_order(self, order_id: str) -> Order:
        """Get order details."""
        pass
    
    @abstractmethod
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Order]:
        """Get all open orders."""
        pass
    
    @abstractmethod
    async def get_positions(self, symbol: Optional[str] = None) -> List[Position]:
        """Get all open positions."""
        pass
    
    @abstractmethod
    async def close_position(self, symbol: str) -> bool:
        """Close a position."""
        pass
    
    @abstractmethod
    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """Get historical OHLCV data."""
        pass
    
    @abstractmethod
    async def subscribe_to_ticks(
        self,
        symbol: str,
        callback: callable
    ) -> bool:
        """Subscribe to real-time tick data."""
        pass
    
    @abstractmethod
    async def unsubscribe_from_ticks(self, symbol: str) -> bool:
        """Unsubscribe from tick data."""
        pass


class MarketRouter:
    """
    Routes trading operations to the appropriate market connector.
    
    This allows BAGBOT2 to trade across multiple markets simultaneously
    with a unified interface.
    """
    
    def __init__(self):
        """Initialize the market router."""
        self.connectors: Dict[MarketType, MarketConnector] = {}
        self.symbol_to_market: Dict[str, MarketType] = {}
        
        logger.info("🌐 MarketRouter initialized")
    
    def register_connector(
        self,
        market_type: MarketType,
        connector: MarketConnector
    ) -> None:
        """
        Register a market connector.
        
        Args:
            market_type: Type of market
            connector: Connector instance
        """
        self.connectors[market_type] = connector
        logger.info(f"✅ Registered {market_type.value} connector")
    
    def register_symbol(self, symbol: str, market_type: MarketType) -> None:
        """
        Register which market a symbol belongs to.
        
        Args:
            symbol: Trading symbol
            market_type: Market type
        """
        self.symbol_to_market[symbol] = market_type
    
    def get_connector(self, symbol: str) -> Optional[MarketConnector]:
        """Get the appropriate connector for a symbol."""
        market_type = self.symbol_to_market.get(symbol)
        if market_type is None:
            logger.error(f"Symbol '{symbol}' not registered")
            return None
        
        connector = self.connectors.get(market_type)
        if connector is None:
            logger.error(f"No connector for market type '{market_type.value}'")
            return None
        
        return connector
    
    async def place_order(
        self,
        symbol: str,
        order_request: OrderRequest
    ) -> Optional[Order]:
        """
        Route order to appropriate market connector.
        
        Args:
            symbol: Trading symbol
            order_request: Order details
            
        Returns:
            Order object if successful, None otherwise
        """
        connector = self.get_connector(symbol)
        if connector is None:
            return None
        
        try:
            order = await connector.place_order(order_request)
            logger.info(
                f"📝 Order placed: {order.side.value} {symbol} "
                f"via {connector.market_type.value}"
            )
            return order
        
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            return None
    
    async def get_positions(
        self,
        market_type: Optional[MarketType] = None
    ) -> List[Position]:
        """
        Get positions from one or all markets.
        
        Args:
            market_type: Specific market type, or None for all markets
            
        Returns:
            List of positions
        """
        all_positions = []
        
        if market_type:
            # Get from specific market
            connector = self.connectors.get(market_type)
            if connector:
                positions = await connector.get_positions()
                all_positions.extend(positions)
        else:
            # Get from all markets
            for connector in self.connectors.values():
                positions = await connector.get_positions()
                all_positions.extend(positions)
        
        return all_positions
    
    async def get_account_summary(self) -> Dict[str, Any]:
        """
        Get aggregated account information across all markets.
        
        Returns:
            Dictionary with total balance, equity, positions, etc.
        """
        summary = {
            "total_balance": 0.0,
            "total_equity": 0.0,
            "total_positions": 0,
            "markets": {}
        }
        
        for market_type, connector in self.connectors.items():
            try:
                account_info = await connector.get_account_info()
                
                summary["total_balance"] += account_info.balance
                summary["total_equity"] += account_info.equity
                summary["total_positions"] += account_info.positions_count
                
                summary["markets"][market_type.value] = {
                    "balance": account_info.balance,
                    "equity": account_info.equity,
                    "positions": account_info.positions_count,
                    "currency": account_info.currency
                }
            
            except Exception as e:
                logger.error(f"Error getting account info for {market_type.value}: {e}")
        
        return summary
    
    def get_supported_markets(self) -> List[str]:
        """Get list of supported market types."""
        return [m.value for m in self.connectors.keys()]
