"""
Exchange Connector Interface
Defines the contract for all exchange integrations
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from datetime import datetime


class OrderSide(Enum):
    """Order side enumeration"""
    BUY = "buy"
    SELL = "sell"


class OrderType(Enum):
    """Order type enumeration"""
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


class OrderStatus(Enum):
    """Order status enumeration"""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELED = "canceled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class PositionSide(Enum):
    """Position side for futures"""
    LONG = "long"
    SHORT = "short"
    BOTH = "both"


@dataclass
class Balance:
    """Account balance representation"""
    asset: str
    free: float
    locked: float
    total: float


@dataclass
class Order:
    """Order representation"""
    id: str
    symbol: str
    side: OrderSide
    type: OrderType
    quantity: float
    price: Optional[float]
    status: OrderStatus
    filled: float
    remaining: float
    timestamp: datetime
    exchange_id: Optional[str] = None
    client_order_id: Optional[str] = None


@dataclass
class Position:
    """Position representation for futures/margin"""
    symbol: str
    side: PositionSide
    size: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    leverage: int
    margin: float


class IExchangeConnector(ABC):
    """
    Interface for exchange connectors
    All exchange implementations must inherit from this class
    """
    
    @abstractmethod
    async def connect(self) -> bool:
        """
        Establish connection to exchange
        Returns True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """
        Close connection to exchange
        Returns True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def fetch_balance(self, asset: Optional[str] = None) -> List[Balance]:
        """
        Fetch account balance
        
        Args:
            asset: Optional specific asset to fetch (e.g., 'USDT', 'BTC')
                   If None, fetches all balances
        
        Returns:
            List of Balance objects
        """
        pass
    
    @abstractmethod
    async def create_order(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        client_order_id: Optional[str] = None,
        **kwargs
    ) -> Order:
        """
        Create a new order
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            side: BUY or SELL
            order_type: MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT
            quantity: Order quantity
            price: Limit price (required for LIMIT orders)
            stop_price: Stop price (required for STOP orders)
            client_order_id: Optional client-generated order ID
            **kwargs: Additional exchange-specific parameters
        
        Returns:
            Order object with exchange response
        """
        pass
    
    @abstractmethod
    async def cancel_order(
        self,
        symbol: str,
        order_id: str
    ) -> Order:
        """
        Cancel an existing order
        
        Args:
            symbol: Trading pair
            order_id: Exchange order ID
        
        Returns:
            Updated Order object
        """
        pass
    
    @abstractmethod
    async def fetch_order(
        self,
        symbol: str,
        order_id: str
    ) -> Order:
        """
        Fetch order details
        
        Args:
            symbol: Trading pair
            order_id: Exchange order ID
        
        Returns:
            Order object with current status
        """
        pass
    
    @abstractmethod
    async def fetch_positions(
        self,
        symbol: Optional[str] = None
    ) -> List[Position]:
        """
        Fetch open positions (for futures/margin trading)
        
        Args:
            symbol: Optional specific symbol to fetch
                    If None, fetches all positions
        
        Returns:
            List of Position objects
        """
        pass
    
    @abstractmethod
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch current ticker/price data
        
        Args:
            symbol: Trading pair
        
        Returns:
            Dict with ticker data (last, bid, ask, volume, etc.)
        """
        pass
    
    @abstractmethod
    def get_exchange_name(self) -> str:
        """
        Get the exchange name identifier
        
        Returns:
            Exchange name (e.g., 'binance', 'coinbase')
        """
        pass
