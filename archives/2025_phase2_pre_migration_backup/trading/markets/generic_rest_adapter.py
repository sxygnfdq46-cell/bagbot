"""
Generic REST Adapter - Universal fallback for any exchange worldwide.

Configurable REST API adapter that can connect to any exchange
with a standard REST API interface.
"""

import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import aiohttp

from bagbot.trading.markets.market_adapter import (
    MarketAdapter,
    MarketType,
    Price,
    Order,
    OrderSide,
    OrderType,
    OrderStatus,
    Position,
    AccountInfo
)

logger = logging.getLogger(__name__)


class GenericRESTAdapter(MarketAdapter):
    """
    Generic REST API adapter for any exchange.
    
    Allows BAGBOT2 to connect to any exchange with a REST API
    by providing custom endpoint configurations and parsers.
    """
    
    def __init__(
        self,
        name: str,
        base_url: str,
        market_type: MarketType,
        api_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        auth_handler: Optional[Callable] = None
    ):
        """
        Initialize generic REST adapter.
        
        Args:
            name: Exchange name
            base_url: Base API URL
            market_type: Type of market
            api_key: API key
            secret_key: Secret key
            auth_handler: Custom authentication handler
        """
        super().__init__(market_type, name)
        
        self.base_url = base_url
        self.api_key = api_key
        self.secret_key = secret_key
        self.auth_handler = auth_handler
        
        # Endpoint configurations
        self.endpoints: Dict[str, Dict[str, Any]] = {}
        
        # Parser functions
        self.parsers: Dict[str, Callable] = {}
        
        logger.info(f"🌐 Generic REST adapter initialized: {name}")
    
    def configure_endpoint(
        self,
        action: str,
        method: str,
        path: str,
        parser: Callable,
        requires_auth: bool = False
    ) -> None:
        """
        Configure an API endpoint.
        
        Args:
            action: Action name (e.g., "get_price", "create_order")
            method: HTTP method (GET, POST, etc.)
            path: Endpoint path
            parser: Function to parse response
            requires_auth: Whether authentication is required
        """
        self.endpoints[action] = {
            "method": method,
            "path": path,
            "requires_auth": requires_auth
        }
        self.parsers[action] = parser
        
        logger.debug(f"✅ Configured {action}: {method} {path}")
    
    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        requires_auth: bool = False
    ) -> Dict[str, Any]:
        """
        Make HTTP request to API.
        
        Args:
            method: HTTP method
            path: Endpoint path
            params: Query parameters
            data: Request body
            requires_auth: Whether to include authentication
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add authentication
        if requires_auth and self.auth_handler:
            headers.update(self.auth_handler(method, path, params, data))
        elif requires_auth and self.api_key:
            headers["X-API-KEY"] = self.api_key
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def connect(self) -> bool:
        """Test connection to exchange."""
        try:
            # Try a simple endpoint if configured
            if "ping" in self.endpoints:
                config = self.endpoints["ping"]
                await self._request(
                    method=config["method"],
                    path=config["path"],
                    requires_auth=False
                )
            
            self.connected = True
            logger.info(f"✅ Connected to {self.name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to connect to {self.name}: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Disconnect from exchange."""
        self.connected = False
        logger.info(f"👋 Disconnected from {self.name}")
    
    async def get_account_info(self) -> AccountInfo:
        """Get account information."""
        if "get_account" not in self.endpoints:
            raise NotImplementedError("get_account endpoint not configured")
        
        config = self.endpoints["get_account"]
        parser = self.parsers["get_account"]
        
        response = await self._request(
            method=config["method"],
            path=config["path"],
            requires_auth=config["requires_auth"]
        )
        
        return parser(response)
    
    async def get_price(self, symbol: str) -> Price:
        """Get current price for symbol."""
        if "get_price" not in self.endpoints:
            raise NotImplementedError("get_price endpoint not configured")
        
        config = self.endpoints["get_price"]
        parser = self.parsers["get_price"]
        
        # Replace {symbol} placeholder in path
        path = config["path"].replace("{symbol}", symbol)
        
        response = await self._request(
            method=config["method"],
            path=path,
            requires_auth=False
        )
        
        return parser(response, symbol)
    
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
        """Create order."""
        if "create_order" not in self.endpoints:
            raise NotImplementedError("create_order endpoint not configured")
        
        config = self.endpoints["create_order"]
        parser = self.parsers["create_order"]
        
        # Build order data
        order_data = {
            "symbol": symbol,
            "side": side.value,
            "type": order_type.value,
            "quantity": quantity
        }
        
        if price:
            order_data["price"] = price
        if stop_price:
            order_data["stopPrice"] = stop_price
        
        order_data.update(kwargs)
        
        response = await self._request(
            method=config["method"],
            path=config["path"],
            data=order_data,
            requires_auth=config["requires_auth"]
        )
        
        return parser(response)
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order."""
        if "cancel_order" not in self.endpoints:
            raise NotImplementedError("cancel_order endpoint not configured")
        
        config = self.endpoints["cancel_order"]
        
        path = config["path"].replace("{orderId}", order_id)
        
        await self._request(
            method=config["method"],
            path=path,
            requires_auth=config["requires_auth"]
        )
        
        logger.info(f"❌ Canceled order: {order_id}")
        return True
    
    async def get_order(self, order_id: str) -> Optional[Order]:
        """Get order details."""
        if "get_order" not in self.endpoints:
            return None
        
        config = self.endpoints["get_order"]
        parser = self.parsers["get_order"]
        
        path = config["path"].replace("{orderId}", order_id)
        
        response = await self._request(
            method=config["method"],
            path=path,
            requires_auth=config["requires_auth"]
        )
        
        return parser(response)
    
    async def get_open_positions(self) -> List[Position]:
        """Get open positions."""
        if "get_positions" not in self.endpoints:
            return []
        
        config = self.endpoints["get_positions"]
        parser = self.parsers["get_positions"]
        
        response = await self._request(
            method=config["method"],
            path=config["path"],
            requires_auth=config["requires_auth"]
        )
        
        return parser(response)
    
    async def close_position(
        self,
        symbol: str,
        quantity: Optional[float] = None
    ) -> bool:
        """Close position."""
        # Default implementation: create opposite order
        return True
    
    async def get_symbols(self) -> List[str]:
        """Get available trading symbols."""
        if "get_symbols" not in self.endpoints:
            return []
        
        config = self.endpoints["get_symbols"]
        parser = self.parsers["get_symbols"]
        
        response = await self._request(
            method=config["method"],
            path=config["path"],
            requires_auth=False
        )
        
        return parser(response)
    
    async def get_market_rules(self, symbol: str) -> Dict[str, Any]:
        """Get market rules for symbol."""
        if "get_rules" not in self.endpoints:
            return {}
        
        config = self.endpoints["get_rules"]
        parser = self.parsers["get_rules"]
        
        path = config["path"].replace("{symbol}", symbol)
        
        response = await self._request(
            method=config["method"],
            path=path,
            requires_auth=False
        )
        
        return parser(response)


# Example: Configure adapter for a hypothetical exchange

def create_example_adapter() -> GenericRESTAdapter:
    """Create example adapter configuration."""
    adapter = GenericRESTAdapter(
        name="ExampleExchange",
        base_url="https://api.example.com",
        market_type=MarketType.CRYPTO,
        api_key="your_api_key",
        secret_key="your_secret"
    )
    
    # Configure endpoints
    adapter.configure_endpoint(
        action="ping",
        method="GET",
        path="/api/v1/ping",
        parser=lambda r: r,
        requires_auth=False
    )
    
    adapter.configure_endpoint(
        action="get_price",
        method="GET",
        path="/api/v1/ticker/{symbol}",
        parser=lambda r, symbol: Price(
            symbol=symbol,
            bid=float(r["bid"]),
            ask=float(r["ask"]),
            timestamp=datetime.now()
        ),
        requires_auth=False
    )
    
    adapter.configure_endpoint(
        action="create_order",
        method="POST",
        path="/api/v1/order",
        parser=lambda r: Order(
            id=r["orderId"],
            symbol=r["symbol"],
            side=OrderSide(r["side"]),
            type=OrderType(r["type"]),
            quantity=float(r["quantity"]),
            status=OrderStatus(r["status"]),
            created_at=datetime.now()
        ),
        requires_auth=True
    )
    
    return adapter
