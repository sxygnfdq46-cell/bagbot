# Backtester

A comprehensive backtesting engine for testing trading strategies against historical market data.

## Features

- **Strategy Testing**: Test any trading strategy against historical OHLCV data
- **Mock Exchange**: Simulates order execution without real trading
- **Position Management**: Tracks long/short positions and unrealized PnL
- **Performance Metrics**: Comprehensive statistics including Sharpe ratio, win rate, max drawdown
- **Equity Curve**: Track portfolio value over time
- **Trade History**: Detailed record of all executed trades

## Quick Start

### Basic Usage

```python
from bagbot.backtester import BacktestEngine
import pandas as pd

# Load historical data
data = pd.read_csv("historical_data.csv")

# Define strategy
def my_strategy(data, current_index, connector):
    """Your strategy logic here."""
    if current_index < 20:
        return None
    
    # Calculate indicators
    sma_20 = data['close'].iloc[current_index-20:current_index].mean()
    current_price = data['close'].iloc[current_index]
    
    # Trading logic
    has_position = "BTC/USDT" in connector.positions
    
    if current_price > sma_20 and not has_position:
        return {"side": "buy", "quantity": 0.1}
    elif current_price < sma_20 and has_position:
        return {"side": "sell", "quantity": 0.1}
    
    return None

# Run backtest
engine = BacktestEngine(initial_capital=10000.0)
result = engine.run(
    data=data,
    strategy_func=my_strategy,
    symbol="BTC/USDT"
)

# View results
print(f"Total Return: {result.total_return_pct:.2f}%")
print(f"Win Rate: {result.win_rate:.2f}%")
print(f"Sharpe Ratio: {result.sharpe_ratio:.2f}")
```

### Run Example

```bash
python backtest_example.py
```

## Data Format

The backtester expects CSV data with the following columns:

```csv
timestamp,open,high,low,close,volume
2024-01-01T00:00:00,42000.0,42500.0,41800.0,42300.0,125.5
2024-01-01T01:00:00,42300.0,42800.0,42100.0,42650.0,145.2
```

- **timestamp**: ISO format datetime string
- **open**: Opening price
- **high**: Highest price in period
- **low**: Lowest price in period
- **close**: Closing price
- **volume**: Trading volume

## Strategy Function

Your strategy function receives three parameters:

```python
def strategy_func(data: pd.DataFrame, current_index: int, connector: MockConnector):
    """
    Args:
        data: Full DataFrame of historical data
        current_index: Current bar index being processed
        connector: Mock connector with balance and position info
    
    Returns:
        Dict with 'side' and 'quantity', or None for no action
    """
    # Your logic here
    return {"side": "buy", "quantity": 0.1}  # or None
```

### Strategy Return Format

Return a dictionary with:
- `side`: "buy" or "sell"
- `quantity`: Amount to trade

Or return `None` to take no action.

### Available Information

Access current positions:
```python
has_position = "BTC/USDT" in connector.positions
if has_position:
    position = connector.positions["BTC/USDT"]
    print(f"Entry price: {position.entry_price}")
    print(f"Quantity: {position.quantity}")
```

Check balance:
```python
balance = await connector.fetch_balance()
usdt_balance = balance["USDT"]["free"]
```

## Backtest Result

The `BacktestResult` object contains:

### Performance Metrics
- `initial_capital`: Starting capital
- `final_capital`: Ending capital
- `total_pnl`: Total profit/loss
- `total_return_pct`: Return percentage

### Trade Statistics
- `total_trades`: Number of completed trades
- `winning_trades`: Number of profitable trades
- `losing_trades`: Number of losing trades
- `win_rate`: Win rate percentage

### Risk Metrics
- `max_drawdown`: Maximum drawdown percentage
- `sharpe_ratio`: Risk-adjusted return metric

### Detailed Data
- `trades`: List of all `Trade` objects
- `equity_curve`: Portfolio value at each time step

### Convert to Dictionary

```python
result_dict = result.to_dict()
# Returns JSON-serializable dictionary with all metrics
```

## Mock Connector

The `MockConnector` simulates exchange behavior:

```python
from bagbot.backtester import MockConnector

connector = MockConnector(initial_balance=10000.0)

# Execute trade
trade = connector.execute_trade(
    symbol="BTC/USDT",
    side="buy",
    price=40000.0,
    quantity=0.1,
    timestamp=datetime.now()
)

# Get total equity
equity = connector.get_total_equity({"BTC/USDT": 42000.0})
```

## Example Strategies

### Moving Average Crossover

```python
def ma_crossover(data, i, connector):
    if i < 20:
        return None
    
    short_ma = data['close'].iloc[i-5:i].mean()
    long_ma = data['close'].iloc[i-20:i].mean()
    
    has_position = "BTC/USDT" in connector.positions
    
    if short_ma > long_ma and not has_position:
        return {"side": "buy", "quantity": 0.1}
    elif short_ma < long_ma and has_position:
        return {"side": "sell", "quantity": 0.1}
    
    return None
```

### RSI Strategy

```python
def rsi_strategy(data, i, connector):
    if i < 14:
        return None
    
    # Calculate RSI
    delta = data['close'].diff()
    gain = delta.where(delta > 0, 0).iloc[i-14:i].mean()
    loss = -delta.where(delta < 0, 0).iloc[i-14:i].mean()
    rs = gain / loss if loss != 0 else 0
    rsi = 100 - (100 / (1 + rs))
    
    has_position = "BTC/USDT" in connector.positions
    
    if rsi < 30 and not has_position:  # Oversold
        return {"side": "buy", "quantity": 0.1}
    elif rsi > 70 and has_position:  # Overbought
        return {"side": "sell", "quantity": 0.1}
    
    return None
```

## Testing

Run all backtester tests:

```bash
pytest bagbot/tests/test_backtester.py -v
```

Run specific test:

```bash
pytest bagbot/tests/test_backtester.py::TestBacktestEngine::test_simple_strategy_backtest -v
```

## Architecture

```
BacktestEngine
├── MockConnector (simulates exchange)
│   ├── execute_trade() - Execute buy/sell orders
│   ├── get_total_equity() - Calculate portfolio value
│   └── fetch_balance() - Get account balance
│
├── Position (tracks open positions)
│   └── unrealized_pnl() - Calculate unrealized profit/loss
│
├── Trade (completed trade record)
│   └── pnl, pnl_percent - Trade performance
│
└── BacktestResult (performance metrics)
    ├── Performance metrics (PnL, return %)
    ├── Trade statistics (win rate, trades)
    ├── Risk metrics (drawdown, Sharpe)
    └── Detailed data (trades, equity curve)
```

## Performance Considerations

- **Memory**: Entire dataset loaded into memory
- **Speed**: Single-threaded, processes ~1000 bars/second
- **Data Size**: Recommended < 100k bars per backtest

For large datasets, consider:
- Splitting into chunks
- Using sampling for quick tests
- Optimizing strategy calculations

## Limitations

- No slippage simulation (executes at exact price)
- No commission/fees (can be added to strategy)
- No order book depth modeling
- Single symbol per backtest
- No partial fills

## Future Enhancements

- [ ] Multi-symbol backtesting
- [ ] Commission/fee support
- [ ] Slippage modeling
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulation
- [ ] Parameter optimization
- [ ] Report generation (HTML/PDF)

## Integration with Optimizer

The backtester integrates with the genetic optimizer:

```python
from bagbot.optimizer import GeneticOptimizer

# Use backtester as fitness function
optimizer = GeneticOptimizer(
    data=data,
    backtest_engine=engine
)

best_params = optimizer.optimize()
```

See `bagbot/optimizer/README.md` for details.
