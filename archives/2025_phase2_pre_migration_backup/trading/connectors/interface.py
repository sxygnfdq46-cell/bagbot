"""Exchange connector interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any


class IExchangeConnector(ABC):
    """Abstract interface for exchange connectors.
    
    All exchange implementations must implement these methods to ensure
    consistent behavior across different exchanges.
    """
    
    @abstractmethod
    async def fetch_balance(self) -> Dict[str, Any]:
        """Fetch account balance from the exchange.
        
        Returns:
            Dict containing balance information with structure:
            {
                "USDT": {"free": 1000.0, "used": 0.0, "total": 1000.0},
                "BTC": {"free": 0.5, "used": 0.1, "total": 0.6},
                ...
            }
        """
        pass
    
    @abstractmethod
    async def create_order(self, order_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order on the exchange.
        
        Args:
            order_payload: Dictionary containing order parameters:
                - symbol (str): Trading pair, e.g., "BTC/USDT"
                - side (str): "buy" or "sell"
                - type (str): "market", "limit", "stop_loss", etc.
                - amount (float): Order quantity
                - price (float, optional): Limit price
                - params (dict, optional): Additional exchange-specific parameters
        
        Returns:
            Dict containing order response:
            {
                "id": "12345",
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "limit",
                "status": "open",
                "amount": 0.001,
                "price": 50000.0,
                "filled": 0.0,
                "remaining": 0.001,
                "timestamp": 1234567890000,
                ...
            }
        """
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """Cancel an existing order.
        
        Args:
            order_id: Exchange order ID to cancel
        
        Returns:
            Dict containing cancellation confirmation:
            {
                "id": "12345",
                "status": "canceled",
                "symbol": "BTC/USDT",
                ...
            }
        """
        pass
    
    @abstractmethod
    async def fetch_positions(self) -> Dict[str, Any]:
        """Fetch open positions (for margin/futures trading).
        
        Returns:
            Dict containing position information:
            {
                "BTC/USDT": {
                    "symbol": "BTC/USDT",
                    "side": "long",
                    "contracts": 0.1,
                    "unrealizedPnl": 100.0,
                    "leverage": 10.0,
                    "entryPrice": 49000.0,
                    "markPrice": 50000.0,
                    ...
                },
                ...
            }
            
            For spot trading, returns empty dict.
        """
        pass
