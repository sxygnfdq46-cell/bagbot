"""
Market Adapter - Base interface for all market connections.

All market adapters (Binance, MT5, Alpaca, etc.) implement this interface.
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class MarketType(Enum):
    """Market types."""
    CRYPTO = "crypto"
    FOREX = "forex"
    STOCKS = "stocks"
    FUTURES = "futures"


class OrderType(Enum):
    """Order types."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSide(Enum):
    """Order sides."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(Enum):
    """Order statuses."""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELED = "canceled"
    REJECTED = "rejected"


@dataclass
class Price:
    """Price data."""
    symbol: str
    bid: float
    ask: float
    timestamp: datetime
    spread: float = 0.0
    volume: float = 0.0
    
    def __post_init__(self):
        """Calculate spread."""
        if self.spread == 0.0:
            self.spread = self.ask - self.bid


@dataclass
class Order:
    """Order data."""
    id: str
    symbol: str
    side: OrderSide
    type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    average_price: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None


@dataclass
class Position:
    """Position data."""
    symbol: str
    side: OrderSide
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float = 0.0
    opened_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None


@dataclass
class AccountInfo:
    """Account information."""
    balance: float
    equity: float
    margin_used: float
    margin_available: float
    open_positions: int
    currency: str = "USD"
    leverage: float = 1.0
    metadata: Dict[str, Any] = None


class MarketAdapter(ABC):
    """
    Base adapter interface for all markets.
    
    Every market connection (Binance, MT5, Alpaca, etc.) extends this.
    """
    
    def __init__(self, market_type: MarketType, name: str):
        """
        Initialize adapter.
        
        Args:
            market_type: Type of market
            name: Adapter name
        """
        self.market_type = market_type
        self.name = name
        self.connected = False
        
        logger.info(f"📡 {name} adapter initialized")
    
    @abstractmethod
    async def connect(self) -> bool:
        """
        Connect to market.
        
        Returns:
            True if connected successfully
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from market."""
        pass
    
    @abstractmethod
    async def get_account_info(self) -> AccountInfo:
        """
        Get account information.
        
        Returns:
            Account info
        """
        pass
    
    @abstractmethod
    async def get_price(self, symbol: str) -> Price:
        """
        Get current price for symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Price data
        """
        pass
    
    @abstractmethod
    async def create_order(
        self,
        symbol: str,
        side: OrderSide,
        quantity: float,
        order_type: OrderType = OrderType.MARKET,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        **kwargs
    ) -> Order:
        """
        Create a new order.
        
        Args:
            symbol: Trading symbol
            side: Buy or sell
            quantity: Order quantity
            order_type: Type of order
            price: Limit price (for limit orders)
            stop_price: Stop price (for stop orders)
            **kwargs: Additional market-specific parameters
            
        Returns:
            Created order
        """
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """
        Cancel an order.
        
        Args:
            order_id: Order ID to cancel
            
        Returns:
            True if canceled successfully
        """
        pass
    
    @abstractmethod
    async def get_order(self, order_id: str) -> Optional[Order]:
        """
        Get order details.
        
        Args:
            order_id: Order ID
            
        Returns:
            Order data or None
        """
        pass
    
    @abstractmethod
    async def get_open_positions(self) -> List[Position]:
        """
        Get all open positions.
        
        Returns:
            List of open positions
        """
        pass
    
    @abstractmethod
    async def close_position(
        self,
        symbol: str,
        quantity: Optional[float] = None
    ) -> bool:
        """
        Close a position.
        
        Args:
            symbol: Trading symbol
            quantity: Quantity to close (None = close all)
            
        Returns:
            True if closed successfully
        """
        pass
    
    @abstractmethod
    async def get_symbols(self) -> List[str]:
        """
        Get available trading symbols.
        
        Returns:
            List of symbols
        """
        pass
    
    @abstractmethod
    async def get_market_rules(self, symbol: str) -> Dict[str, Any]:
        """
        Get market-specific rules for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Market rules (min quantity, tick size, etc.)
        """
        pass
    
    def is_connected(self) -> bool:
        """Check if connected to market."""
        return self.connected
    
    def get_market_type(self) -> MarketType:
        """Get market type."""
        return self.market_type
    
    def get_name(self) -> str:
        """Get adapter name."""
        return self.name
