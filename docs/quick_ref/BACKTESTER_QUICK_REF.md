# Backtester Quick Reference

## Run Example
```bash
python backtest_example.py
```

## Basic Usage
```python
from bagbot.backtester import BacktestEngine
import pandas as pd

# Load data
data = pd.read_csv("data.csv")  # timestamp,open,high,low,close,volume

# Define strategy
def strategy(data, i, connector):
    if i < 20:
        return None
    
    sma = data['close'].iloc[i-20:i].mean()
    price = data['close'].iloc[i]
    has_pos = "BTC/USDT" in connector.positions
    
    if price > sma and not has_pos:
        return {"side": "buy", "quantity": 0.1}
    elif price < sma and has_pos:
        return {"side": "sell", "quantity": 0.1}
    return None

# Run backtest
engine = BacktestEngine(initial_capital=10000)
result = engine.run(data, strategy, "BTC/USDT")

# View results
print(f"Return: {result.total_return_pct:.2f}%")
print(f"Trades: {result.total_trades}")
print(f"Win Rate: {result.win_rate:.2f}%")
print(f"Sharpe: {result.sharpe_ratio:.2f}")
```

## Result Fields
- `initial_capital` - Starting capital
- `final_capital` - Ending capital
- `total_pnl` - Total profit/loss
- `total_return_pct` - Return percentage
- `total_trades` - Number of trades
- `winning_trades` - Winning trades count
- `losing_trades` - Losing trades count
- `win_rate` - Win rate percentage
- `max_drawdown` - Max drawdown %
- `sharpe_ratio` - Sharpe ratio
- `trades` - List of Trade objects
- `equity_curve` - Equity at each bar

## Run Tests
```bash
pytest bagbot/tests/test_backtester.py -v
```

## Files
- `bagbot/backtester/engine.py` - Core engine
- `bagbot/backtester/README.md` - Full documentation
- `backtest_example.py` - Working example
- `bagbot/tests/data/backtest_sample.csv` - Sample data
- `bagbot/tests/test_backtester.py` - 14 tests (all passing)
