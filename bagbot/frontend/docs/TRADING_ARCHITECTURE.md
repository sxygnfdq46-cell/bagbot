# Trading Connector Architecture Documentation

## Overview

Bagbot includes a comprehensive trading system that supports automated order execution, risk management, and backtesting. The architecture is modular and extensible to support multiple exchanges.

## Components

### 1. Exchange Connectors

#### IExchangeConnector Interface (`trading/exchange_interface.py`)

Base interface that all exchange connectors must implement:

**Core Methods:**
- `connect()` - Establish connection to exchange
- `disconnect()` - Close connection
- `fetch_balance(asset)` - Get account balances
- `create_order()` - Place new orders
- `cancel_order()` - Cancel existing orders
- `fetch_order()` - Get order details
- `fetch_positions()` - Get open positions (futures)
- `fetch_ticker()` - Get current price data

**Data Models:**
- `Balance` - Account balance representation
- `Order` - Order details with status
- `Position` - Futures/margin position data
- `OrderSide` - BUY/SELL enum
- `OrderType` - MARKET/LIMIT/STOP_LOSS/TAKE_PROFIT
- `OrderStatus` - Order state tracking

#### Binance Connector (`trading/binance_connector.py`)

Implementation for Binance exchange using CCXT library:

```python
from trading.binance_connector import BinanceConnector

# Initialize connector
connector = BinanceConnector(
    api_key="your_api_key",  # or set BINANCE_API_KEY env var
    api_secret="your_secret",  # or set BINANCE_API_SECRET env var
    testnet=True,  # Use testnet for development
    futures=False  # True for futures, False for spot
)

# Connect to exchange
await connector.connect()

# Fetch balance
balances = await connector.fetch_balance("USDT")

# Create market buy order
order = await connector.create_order(
    symbol="BTCUSDT",
    side=OrderSide.BUY,
    order_type=OrderType.MARKET,
    quantity=0.001
)

# Disconnect
await connector.disconnect()
```

### 2. Order Management

#### TradingOrder Model (`backend/models.py`)

Database model for tracking all orders:

**Fields:**
- `user_id` - User identifier
- `exchange` - Exchange name (binance, coinbase, etc.)
- `exchange_order_id` - Order ID from exchange
- `client_order_id` - Internal unique order ID
- `symbol` - Trading pair (e.g., BTCUSDT)
- `side` - buy/sell
- `order_type` - market/limit/stop_loss
- `quantity` - Order size
- `price` - Limit price (optional)
- `status` - Order status enum
- `source` - Order source (manual/tradingview/strategy/api)
- `risk_check_passed` - Risk validation result

#### Order Routes (`api/order_routes.py`)

REST API for order management:

```bash
# Create new order
POST /api/orders/create
{
  "symbol": "BTCUSDT",
  "side": "buy",
  "order_type": "market",
  "quantity": 0.001,
  "user_id": "user123"
}

# List orders
GET /api/orders/list?user_id=user123&symbol=BTCUSDT&status=filled

# Get order details
GET /api/orders/{order_id}

# Cancel order
POST /api/orders/{order_id}/cancel

# Refresh order status from exchange
POST /api/orders/{order_id}/refresh
```

#### Order Executor (`trading/order_executor.py`)

Handles actual order execution on exchanges:

```python
from trading.order_executor import OrderExecutor

executor = OrderExecutor()

# Execute order
await executor.execute_order(order, db)

# Cancel order
await executor.cancel_order(order, db)

# Update order status
await executor.update_order_status(order, db)
```

### 3. Risk Management

#### Risk Manager (`trading/risk_manager.py`)

Validates orders before execution:

**Risk Checks:**
1. **Order Size Limit** - Max order value in USD
2. **Position Size Limit** - Max total position size
3. **Daily Loss Limit** - Max daily loss threshold
4. **Max Open Orders** - Per-symbol order limit
5. **Minimum Order Value** - Minimum order size

**Configuration (Environment Variables):**
```bash
MAX_ORDER_SIZE_USD=10000          # Max $10k per order
MAX_POSITION_SIZE_USD=50000       # Max $50k total position
MAX_DAILY_LOSS_USD=5000           # Max $5k daily loss
MAX_OPEN_ORDERS_PER_SYMBOL=5      # Max 5 orders per symbol
MIN_ORDER_VALUE_USD=10            # Min $10 per order
```

**Usage:**
```python
from trading.risk_manager import RiskManager

risk_manager = RiskManager()
result = await risk_manager.check_order(order, db, current_price=50000)

if result.passed:
    # Proceed with order execution
    pass
else:
    # Reject order
    print(f"Risk check failed: {result.reason}")
```

### 4. TradingView Integration

#### Webhook Endpoint (`api/tradingview_routes.py`)

Receives automated trading signals from TradingView alerts:

**Endpoint:**
```bash
POST /api/tradingview/webhook
X-TradingView-Signature: <hmac_signature>

{
  "ticker": "BTCUSDT",
  "action": "buy",
  "order_type": "market",
  "quantity": 0.001,
  "price": 50000,
  "strategy": "my_strategy",
  "alert_id": "alert_123"
}
```

**Supported Actions:**
- `buy` - Open long position
- `sell` - Open short position or close long
- `close` - Close all positions for symbol

**Setup TradingView Alert:**
1. Create alert in TradingView
2. Set webhook URL: `https://api.thebagbot.trade/api/tradingview/webhook`
3. Set message format (JSON):
```json
{
  "ticker": "{{ticker}}",
  "action": "buy",
  "order_type": "market",
  "quantity": 0.001,
  "strategy": "{{strategy}}",
  "alert_id": "{{time}}"
}
```

**Security:**
- Signature verification using HMAC-SHA256
- Set `TRADINGVIEW_SECRET` environment variable
- TradingView sends signature in `X-TradingView-Signature` header

### 5. Backtesting

#### Backtester (`trading/backtester.py`)

Framework for testing strategies on historical data:

**Usage:**
```python
import pandas as pd
from trading.backtester import Backtester, SimpleMovingAverageStrategy

# Load historical OHLC data
data = pd.read_csv('BTCUSDT-1h.csv')
data = data.set_index('timestamp')

# Create strategy
strategy = SimpleMovingAverageStrategy(
    fast_period=20,
    slow_period=50
)

# Create backtester
backtester = Backtester(
    initial_balance=10000,
    commission=0.001,  # 0.1% commission
    slippage=0.0005    # 0.05% slippage
)

# Run backtest
result = backtester.run(strategy, data, symbol="BTC/USDT")

# Print results
print(f"Total Return: {result.total_return_pct:.2f}%")
print(f"Sharpe Ratio: {result.sharpe_ratio:.2f}")
print(f"Max Drawdown: {result.max_drawdown:.2f}%")
print(f"Win Rate: {result.win_rate:.2f}%")
```

**Custom Strategy:**
```python
from trading.backtester import Strategy
import pandas as pd

class MyStrategy(Strategy):
    def __init__(self, rsi_period=14):
        super().__init__(name="RSI_Strategy")
        self.rsi_period = rsi_period
    
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        # Calculate RSI
        delta = data['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        # Generate signals
        signals = pd.Series(0, index=data.index)
        signals[rsi < 30] = 1   # Buy when oversold
        signals[rsi > 70] = -1  # Sell when overbought
        
        return signals
```

**Backtest Results:**
```python
@dataclass
class BacktestResult:
    initial_balance: float
    final_balance: float
    total_return: float
    total_return_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    trades: List[Trade]
    equity_curve: pd.DataFrame
    metrics: Dict
```

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    exchange VARCHAR NOT NULL,
    exchange_order_id VARCHAR,
    client_order_id VARCHAR UNIQUE NOT NULL,
    
    symbol VARCHAR NOT NULL,
    side VARCHAR NOT NULL,
    order_type VARCHAR NOT NULL,
    quantity FLOAT NOT NULL,
    price FLOAT,
    stop_price FLOAT,
    
    status VARCHAR NOT NULL,  -- enum: pending, open, filled, etc.
    filled_quantity FLOAT DEFAULT 0,
    remaining_quantity FLOAT,
    average_fill_price FLOAT,
    
    source VARCHAR NOT NULL,  -- enum: manual, tradingview, strategy, api
    source_signal_id VARCHAR,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    filled_at TIMESTAMP,
    
    risk_check_passed VARCHAR DEFAULT 'pending',
    risk_check_reason VARCHAR,
    
    metadata TEXT  -- JSON
);
```

## Environment Variables

```bash
# Exchange Credentials
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret

# TradingView Webhook
TRADINGVIEW_SECRET=your_webhook_secret

# Risk Management
MAX_ORDER_SIZE_USD=10000
MAX_POSITION_SIZE_USD=50000
MAX_DAILY_LOSS_USD=5000
MAX_OPEN_ORDERS_PER_SYMBOL=5
MIN_ORDER_VALUE_USD=10

# Database
DATABASE_URL=sqlite:///./bagbot.db
```

## Testing

```bash
# Install dependencies
pip install ccxt python-binance

# Run backtester example
python bagbot/trading/backtester.py

# Test order creation (requires API keys)
curl -X POST http://localhost:8000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "buy",
    "order_type": "market",
    "quantity": 0.001,
    "user_id": "test_user"
  }'
```

## Production Checklist

- [ ] Set production Binance API keys (not testnet)
- [ ] Configure risk management limits appropriately
- [ ] Set TradingView webhook secret for signature verification
- [ ] Enable order execution (currently manual approval may be required)
- [ ] Set up monitoring for failed orders
- [ ] Configure database backups
- [ ] Test with small amounts first
- [ ] Set up alerts for risk limit breaches
- [ ] Review and adjust commission/slippage settings

## Future Enhancements

1. **Multiple Exchange Support**
   - Coinbase connector
   - Kraken connector
   - Exchange routing/arbitrage

2. **Advanced Order Types**
   - Trailing stops
   - OCO (One-Cancels-Other)
   - Iceberg orders

3. **Portfolio Management**
   - Multi-asset rebalancing
   - Position sizing algorithms
   - Portfolio optimization

4. **Advanced Risk Management**
   - VaR (Value at Risk) calculations
   - Correlation analysis
   - Dynamic position sizing

5. **Strategy Framework**
   - Strategy marketplace
   - Paper trading mode
   - Strategy optimization/genetic algorithms

6. **Notifications**
   - Order fills via email/SMS
   - Risk breach alerts
   - Performance reports
