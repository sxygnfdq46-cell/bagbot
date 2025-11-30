# Trading Connector Usage Examples

## Basic Setup

```python
import asyncio
from trading.connectors import BinanceConnector

async def main():
    # Initialize connector in testnet mode (sandbox)
    connector = BinanceConnector(
        api_key="your_testnet_key",
        api_secret="your_testnet_secret",
        testnet=True,  # Use testnet for development
        futures=False  # Spot trading mode
    )
    
    try:
        # Fetch account balance
        balance = await connector.fetch_balance()
        print(f"Account balance: {balance}")
        
        # Get current BTC/USDT price
        ticker = await connector.fetch_ticker("BTC/USDT")
        print(f"BTC/USDT price: ${ticker['last']:,.2f}")
        
        # Create a market buy order (testnet only!)
        order = await connector.create_order({
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "amount": 0.001
        })
        print(f"Order created: {order['id']}, status: {order['status']}")
        
        # Fetch order details
        order_status = await connector.fetch_order(order['id'], "BTC/USDT")
        print(f"Order status: {order_status['status']}")
        
    finally:
        # Always close the connector
        await connector.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Using Environment Variables

Set credentials in `.env` file:
```bash
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
```

Then use without explicit credentials:
```python
connector = BinanceConnector(testnet=True)
```

## Limit Orders

```python
# Create a limit buy order
order = await connector.create_order({
    "symbol": "ETH/USDT",
    "side": "buy",
    "type": "limit",
    "amount": 0.1,
    "price": 2000.0  # Limit price
})

# Cancel the order if needed
cancel_result = await connector.cancel_order(order['id'], "ETH/USDT")
```

## Futures Trading

```python
# Initialize for futures trading
futures_connector = BinanceConnector(
    testnet=True,
    futures=True  # Enable futures mode
)

# Fetch open positions
positions = await futures_connector.fetch_positions()
for symbol, position in positions.items():
    print(f"{symbol}: {position['contracts']} contracts, "
          f"PnL: ${position['unrealizedPnl']:.2f}")
```

## Error Handling

```python
from ccxt.base.errors import NetworkError, ExchangeError

try:
    balance = await connector.fetch_balance()
except NetworkError as e:
    print(f"Network error: {e}")
    # Retry logic here
except ExchangeError as e:
    print(f"Exchange error: {e}")
    # Handle exchange-specific errors
```

## Context Manager (Clean Shutdown)

```python
async def safe_trading():
    connector = BinanceConnector(testnet=True)
    
    try:
        balance = await connector.fetch_balance()
        # ... trading operations ...
    finally:
        await connector.close()
```

## Testing Mode

The connector is designed for safe testing:

1. **Always use `testnet=True` for development**
2. **Testnet has separate API keys** - get them from Binance Testnet
3. **No real money involved** in testnet mode
4. **All tests use mocked exchanges** - no real API calls during unit tests

## Production Checklist

Before going live:
- [ ] Obtain production Binance API keys
- [ ] Set `testnet=False`
- [ ] Test with small amounts first
- [ ] Implement proper error handling
- [ ] Add logging for all operations
- [ ] Set up monitoring/alerts
- [ ] Review API rate limits
- [ ] Enable IP whitelisting on Binance

## Extending the Connector

To add more exchanges, implement the `IExchangeConnector` interface:

```python
from trading.connectors import IExchangeConnector

class CoinbaseConnector(IExchangeConnector):
    async def fetch_balance(self) -> dict:
        # Implement Coinbase balance fetching
        pass
    
    async def create_order(self, order_payload: dict) -> dict:
        # Implement Coinbase order creation
        pass
    
    # ... implement other methods
```
