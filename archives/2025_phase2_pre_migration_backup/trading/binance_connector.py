"""
Binance Exchange Connector Implementation
"""
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import ccxt
from trading.exchange_interface import (
    IExchangeConnector,
    Balance,
    Order,
    Position,
    OrderSide,
    OrderType,
    OrderStatus,
    PositionSide
)

logger = logging.getLogger(__name__)


class BinanceConnector(IExchangeConnector):
    """
    Binance exchange connector using CCXT library
    Supports both spot and futures trading
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        testnet: bool = False,
        futures: bool = False
    ):
        """
        Initialize Binance connector
        
        Args:
            api_key: Binance API key (reads from BINANCE_API_KEY env if None)
            api_secret: Binance API secret (reads from BINANCE_API_SECRET env if None)
            testnet: Use testnet endpoints
            futures: Use futures API instead of spot
        """
        self.api_key = api_key or os.getenv("BINANCE_API_KEY", "")
        self.api_secret = api_secret or os.getenv("BINANCE_API_SECRET", "")
        self.testnet = testnet
        self.futures = futures
        self.exchange: Optional[ccxt.binance] = None
        self._connected = False
    
    async def connect(self) -> bool:
        """Establish connection to Binance"""
        try:
            # Initialize CCXT Binance instance
            self.exchange = ccxt.binance({
                'apiKey': self.api_key,
                'secret': self.api_secret,
                'enableRateLimit': True,
                'options': {
                    'defaultType': 'future' if self.futures else 'spot',
                    'adjustForTimeDifference': True,
                }
            })
            
            if self.testnet:
                self.exchange.set_sandbox_mode(True)
                logger.info("Binance connector initialized in TESTNET mode")
            
            # Test connection by fetching server time
            await self.exchange.fetch_time()
            
            self._connected = True
            logger.info(f"Connected to Binance ({'futures' if self.futures else 'spot'})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Binance: {e}")
            self._connected = False
            return False
    
    async def disconnect(self) -> bool:
        """Close connection to Binance"""
        try:
            if self.exchange:
                await self.exchange.close()
            self._connected = False
            logger.info("Disconnected from Binance")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting from Binance: {e}")
            return False
    
    async def fetch_balance(self, asset: Optional[str] = None) -> List[Balance]:
        """Fetch account balance"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        try:
            balance_data = await self.exchange.fetch_balance()
            balances = []
            
            if asset:
                # Fetch specific asset
                if asset in balance_data:
                    b = balance_data[asset]
                    balances.append(Balance(
                        asset=asset,
                        free=float(b.get('free', 0)),
                        locked=float(b.get('used', 0)),
                        total=float(b.get('total', 0))
                    ))
            else:
                # Fetch all non-zero balances
                for asset_name, b in balance_data.get('total', {}).items():
                    if float(b) > 0:
                        balances.append(Balance(
                            asset=asset_name,
                            free=float(balance_data['free'].get(asset_name, 0)),
                            locked=float(balance_data['used'].get(asset_name, 0)),
                            total=float(b)
                        ))
            
            return balances
            
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            raise
    
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
        """Create a new order on Binance"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        try:
            # Map our order types to CCXT types
            ccxt_type = self._map_order_type(order_type)
            ccxt_side = side.value
            
            # Prepare order parameters
            params = {}
            if client_order_id:
                params['newClientOrderId'] = client_order_id
            
            # Add stop price for stop orders
            if stop_price and order_type in [OrderType.STOP_LOSS, OrderType.TAKE_PROFIT]:
                params['stopPrice'] = stop_price
            
            # Merge additional parameters
            params.update(kwargs)
            
            # Create order
            if order_type == OrderType.MARKET:
                result = await self.exchange.create_market_order(
                    symbol=symbol,
                    side=ccxt_side,
                    amount=quantity,
                    params=params
                )
            else:
                if price is None:
                    raise ValueError(f"{order_type} orders require price parameter")
                result = await self.exchange.create_limit_order(
                    symbol=symbol,
                    side=ccxt_side,
                    amount=quantity,
                    price=price,
                    params=params
                )
            
            # Convert to our Order format
            order = self._ccxt_to_order(result)
            logger.info(f"Created order: {order.id} - {symbol} {side.value} {quantity}")
            return order
            
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            raise
    
    async def cancel_order(self, symbol: str, order_id: str) -> Order:
        """Cancel an existing order"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        try:
            result = await self.exchange.cancel_order(order_id, symbol)
            order = self._ccxt_to_order(result)
            logger.info(f"Canceled order: {order_id}")
            return order
            
        except Exception as e:
            logger.error(f"Error canceling order {order_id}: {e}")
            raise
    
    async def fetch_order(self, symbol: str, order_id: str) -> Order:
        """Fetch order details"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        try:
            result = await self.exchange.fetch_order(order_id, symbol)
            return self._ccxt_to_order(result)
            
        except Exception as e:
            logger.error(f"Error fetching order {order_id}: {e}")
            raise
    
    async def fetch_positions(self, symbol: Optional[str] = None) -> List[Position]:
        """Fetch open positions (futures only)"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        if not self.futures:
            logger.warning("fetch_positions called on spot account, returning empty list")
            return []
        
        try:
            positions_data = await self.exchange.fetch_positions(symbols=[symbol] if symbol else None)
            positions = []
            
            for pos in positions_data:
                if float(pos.get('contracts', 0)) > 0:  # Only return open positions
                    positions.append(Position(
                        symbol=pos['symbol'],
                        side=PositionSide.LONG if pos['side'] == 'long' else PositionSide.SHORT,
                        size=float(pos.get('contracts', 0)),
                        entry_price=float(pos.get('entryPrice', 0)),
                        current_price=float(pos.get('markPrice', 0)),
                        unrealized_pnl=float(pos.get('unrealizedPnl', 0)),
                        leverage=int(pos.get('leverage', 1)),
                        margin=float(pos.get('initialMargin', 0))
                    ))
            
            return positions
            
        except Exception as e:
            logger.error(f"Error fetching positions: {e}")
            raise
    
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """Fetch current ticker/price data"""
        if not self._connected:
            raise RuntimeError("Not connected to exchange. Call connect() first.")
        
        try:
            ticker = await self.exchange.fetch_ticker(symbol)
            return {
                'symbol': ticker['symbol'],
                'last': ticker.get('last'),
                'bid': ticker.get('bid'),
                'ask': ticker.get('ask'),
                'volume': ticker.get('baseVolume'),
                'timestamp': ticker.get('timestamp'),
            }
            
        except Exception as e:
            logger.error(f"Error fetching ticker for {symbol}: {e}")
            raise
    
    def get_exchange_name(self) -> str:
        """Get exchange identifier"""
        return "binance"
    
    def _map_order_type(self, order_type: OrderType) -> str:
        """Map our OrderType to CCXT order type"""
        mapping = {
            OrderType.MARKET: 'market',
            OrderType.LIMIT: 'limit',
            OrderType.STOP_LOSS: 'stop_loss',
            OrderType.TAKE_PROFIT: 'take_profit',
        }
        return mapping.get(order_type, 'limit')
    
    def _ccxt_to_order(self, ccxt_order: Dict) -> Order:
        """Convert CCXT order format to our Order object"""
        status_map = {
            'open': OrderStatus.OPEN,
            'closed': OrderStatus.FILLED,
            'canceled': OrderStatus.CANCELED,
            'expired': OrderStatus.EXPIRED,
            'rejected': OrderStatus.REJECTED,
        }
        
        side_map = {
            'buy': OrderSide.BUY,
            'sell': OrderSide.SELL,
        }
        
        type_map = {
            'market': OrderType.MARKET,
            'limit': OrderType.LIMIT,
            'stop_loss': OrderType.STOP_LOSS,
            'take_profit': OrderType.TAKE_PROFIT,
        }
        
        return Order(
            id=str(ccxt_order['id']),
            symbol=ccxt_order['symbol'],
            side=side_map.get(ccxt_order['side'], OrderSide.BUY),
            type=type_map.get(ccxt_order['type'], OrderType.LIMIT),
            quantity=float(ccxt_order.get('amount', 0)),
            price=float(ccxt_order.get('price', 0)) if ccxt_order.get('price') else None,
            status=status_map.get(ccxt_order['status'], OrderStatus.PENDING),
            filled=float(ccxt_order.get('filled', 0)),
            remaining=float(ccxt_order.get('remaining', 0)),
            timestamp=datetime.fromtimestamp(ccxt_order['timestamp'] / 1000) if ccxt_order.get('timestamp') else datetime.utcnow(),
            exchange_id=str(ccxt_order['id']),
            client_order_id=ccxt_order.get('clientOrderId')
        )
