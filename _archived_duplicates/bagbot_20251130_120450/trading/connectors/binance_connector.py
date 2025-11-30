"""Binance exchange connector implementation."""

import os
import logging
from typing import Dict, Any, Optional
import ccxt.async_support as ccxt

from .interface import IExchangeConnector

logger = logging.getLogger(__name__)


class BinanceConnector(IExchangeConnector):
    """Binance exchange connector using CCXT library.
    
    Supports both spot and futures trading on Binance.
    Credentials are read from environment variables.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        testnet: bool = False,
        futures: bool = False,
    ):
        """Initialize Binance connector.
        
        Args:
            api_key: Binance API key (defaults to BINANCE_API_KEY env var)
            api_secret: Binance API secret (defaults to BINANCE_API_SECRET env var)
            testnet: Use testnet endpoints (sandbox mode)
            futures: Use futures trading (default is spot)
        """
        self.api_key = api_key or os.getenv("BINANCE_API_KEY", "")
        self.api_secret = api_secret or os.getenv("BINANCE_API_SECRET", "")
        self.testnet = testnet
        self.futures = futures
        self._exchange: Optional[ccxt.binance] = None
        
        logger.info(
            f"Initializing BinanceConnector (testnet={testnet}, futures={futures})"
        )
    
    async def _get_exchange(self) -> ccxt.binance:
        """Get or create CCXT exchange instance.
        
        Returns:
            Configured CCXT Binance exchange instance
        """
        if self._exchange is None:
            config = {
                "apiKey": self.api_key,
                "secret": self.api_secret,
                "enableRateLimit": True,
                "options": {},
            }
            
            if self.testnet:
                config["urls"] = {
                    "api": {
                        "public": "https://testnet.binance.vision/api",
                        "private": "https://testnet.binance.vision/api",
                    }
                }
            
            if self.futures:
                config["options"]["defaultType"] = "future"
            
            self._exchange = ccxt.binance(config)
            
            logger.info("CCXT Binance exchange instance created")
        
        return self._exchange
    
    async def close(self):
        """Close the exchange connection."""
        if self._exchange is not None:
            await self._exchange.close()
            self._exchange = None
            logger.info("Binance connector closed")
    
    async def fetch_balance(self) -> Dict[str, Any]:
        """Fetch account balance from Binance.
        
        Returns:
            Dictionary with balance information per asset
        """
        try:
            exchange = await self._get_exchange()
            balance = await exchange.fetch_balance()
            
            # Extract relevant balance data
            result = {}
            for currency, values in balance.get("total", {}).items():
                if values > 0:  # Only include non-zero balances
                    result[currency] = {
                        "free": balance.get("free", {}).get(currency, 0.0),
                        "used": balance.get("used", {}).get(currency, 0.0),
                        "total": values,
                    }
            
            logger.info(f"Fetched balance for {len(result)} assets")
            return result
        
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            raise
    
    async def create_order(self, order_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order on Binance.
        
        Args:
            order_payload: Order parameters
                - symbol: Trading pair (e.g., "BTC/USDT")
                - side: "buy" or "sell"
                - type: "market", "limit", etc.
                - amount: Order quantity
                - price: Limit price (for limit orders)
                - params: Additional parameters
        
        Returns:
            Order response from exchange
        """
        try:
            exchange = await self._get_exchange()
            
            symbol = order_payload["symbol"]
            side = order_payload["side"].lower()
            order_type = order_payload["type"].lower()
            amount = float(order_payload["amount"])
            price = order_payload.get("price")
            params = order_payload.get("params", {})
            
            # Create order
            if order_type == "market":
                order = await exchange.create_market_order(
                    symbol, side, amount, params
                )
            elif order_type == "limit":
                if price is None:
                    raise ValueError("Limit orders require a price")
                price = float(price)
                order = await exchange.create_limit_order(
                    symbol, side, amount, price, params
                )
            else:
                # Generic order creation for other types
                order = await exchange.create_order(
                    symbol, order_type, side, amount, price, params
                )
            
            logger.info(
                f"Created {order_type} {side} order for {amount} {symbol}: {order['id']}"
            )
            return order
        
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            raise
    
    async def cancel_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Cancel an existing order on Binance.
        
        Args:
            order_id: Exchange order ID
            symbol: Trading pair (required by some exchanges)
        
        Returns:
            Cancellation confirmation
        """
        try:
            exchange = await self._get_exchange()
            
            # Some exchanges require symbol for cancellation
            if symbol:
                result = await exchange.cancel_order(order_id, symbol)
            else:
                result = await exchange.cancel_order(order_id)
            
            logger.info(f"Canceled order {order_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error canceling order {order_id}: {e}")
            raise
    
    async def fetch_positions(self) -> Dict[str, Any]:
        """Fetch open positions from Binance.
        
        For spot trading, returns empty dict.
        For futures, returns open positions.
        
        Returns:
            Dictionary of open positions
        """
        try:
            if not self.futures:
                # Spot trading doesn't have positions
                return {}
            
            exchange = await self._get_exchange()
            positions = await exchange.fetch_positions()
            
            # Filter to only open positions and format result
            result = {}
            for position in positions:
                if float(position.get("contracts", 0)) != 0:
                    symbol = position["symbol"]
                    result[symbol] = {
                        "symbol": symbol,
                        "side": position.get("side"),
                        "contracts": float(position.get("contracts", 0)),
                        "unrealizedPnl": float(position.get("unrealizedPnl", 0)),
                        "leverage": float(position.get("leverage", 1)),
                        "entryPrice": float(position.get("entryPrice", 0)),
                        "markPrice": float(position.get("markPrice", 0)),
                        "liquidationPrice": float(position.get("liquidationPrice", 0)),
                        "marginType": position.get("marginType"),
                        "timestamp": position.get("timestamp"),
                    }
            
            logger.info(f"Fetched {len(result)} open positions")
            return result
        
        except Exception as e:
            logger.error(f"Error fetching positions: {e}")
            raise
    
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """Fetch current ticker/price for a symbol.
        
        Args:
            symbol: Trading pair (e.g., "BTC/USDT")
        
        Returns:
            Ticker information including bid, ask, last price
        """
        try:
            exchange = await self._get_exchange()
            ticker = await exchange.fetch_ticker(symbol)
            
            logger.debug(f"Fetched ticker for {symbol}: {ticker.get('last')}")
            return ticker
        
        except Exception as e:
            logger.error(f"Error fetching ticker for {symbol}: {e}")
            raise
    
    async def fetch_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Fetch order details.
        
        Args:
            order_id: Exchange order ID
            symbol: Trading pair (required by some exchanges)
        
        Returns:
            Order details
        """
        try:
            exchange = await self._get_exchange()
            
            if symbol:
                order = await exchange.fetch_order(order_id, symbol)
            else:
                order = await exchange.fetch_order(order_id)
            
            logger.debug(f"Fetched order {order_id}: {order.get('status')}")
            return order
        
        except Exception as e:
            logger.error(f"Error fetching order {order_id}: {e}")
            raise
