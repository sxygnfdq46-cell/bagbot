"""Example backtest script demonstrating strategy testing."""

import pandas as pd
from bagbot.backtester import BacktestEngine
from typing import Dict, Any, Optional


def simple_moving_average_strategy(
    data: pd.DataFrame,
    current_index: int,
    connector,
) -> Optional[Dict[str, Any]]:
    """Simple moving average crossover strategy.
    
    Buys when short MA crosses above long MA.
    Sells when short MA crosses below long MA.
    
    Args:
        data: Historical OHLCV data
        current_index: Current bar index
        connector: Mock connector for checking positions
        
    Returns:
        Order dict with side and quantity, or None
    """
    # Need at least 20 bars for indicators
    if current_index < 20:
        return None
    
    # Calculate moving averages
    short_window = 5
    long_window = 20
    
    short_ma = data['close'].iloc[current_index - short_window:current_index].mean()
    long_ma = data['close'].iloc[current_index - long_window:current_index].mean()
    
    prev_short_ma = data['close'].iloc[current_index - short_window - 1:current_index - 1].mean()
    prev_long_ma = data['close'].iloc[current_index - long_window - 1:current_index - 1].mean()
    
    current_price = data['close'].iloc[current_index]
    position_size = 0.1  # Buy/sell 0.1 BTC per signal
    
    # Check if we have an open position
    has_position = "BTC/USDT" in connector.positions
    
    # Buy signal: short MA crosses above long MA
    if short_ma > long_ma and prev_short_ma <= prev_long_ma and not has_position:
        return {"side": "buy", "quantity": position_size}
    
    # Sell signal: short MA crosses below long MA
    elif short_ma < long_ma and prev_short_ma >= prev_long_ma and has_position:
        return {"side": "sell", "quantity": position_size}
    
    return None


def main():
    """Run example backtest."""
    print("=" * 60)
    print("BACKTESTING EXAMPLE: Simple Moving Average Crossover")
    print("=" * 60)
    
    # Load sample data
    data_path = "bagbot/tests/data/backtest_sample.csv"
    print(f"\n📊 Loading data from: {data_path}")
    
    try:
        data = pd.read_csv(data_path)
        print(f"✅ Loaded {len(data)} bars")
        print(f"   Date range: {data['timestamp'].iloc[0]} to {data['timestamp'].iloc[-1]}")
        print(f"   Price range: ${data['close'].min():.2f} - ${data['close'].max():.2f}")
    except FileNotFoundError:
        print(f"❌ Sample data not found. Creating sample data...")
        # Create sample data
        import numpy as np
        dates = pd.date_range(start='2024-01-01', periods=100, freq='1h')
        
        # Generate trending price data
        np.random.seed(42)
        trend = np.linspace(40000, 45000, 100)
        noise = np.random.normal(0, 500, 100)
        prices = trend + noise
        
        data = pd.DataFrame({
            'timestamp': dates,
            'open': prices,
            'high': prices + np.random.uniform(0, 300, 100),
            'low': prices - np.random.uniform(0, 300, 100),
            'close': prices,
            'volume': np.random.uniform(100, 1000, 100)
        })
        
        # Save sample data
        import os
        os.makedirs("bagbot/tests/data", exist_ok=True)
        data.to_csv(data_path, index=False)
        print(f"✅ Created sample data with {len(data)} bars")
    
    # Initialize backtest engine
    initial_capital = 10000.0
    print(f"\n💰 Initial Capital: ${initial_capital:,.2f}")
    
    engine = BacktestEngine(initial_capital=initial_capital)
    
    # Run backtest
    print("\n🚀 Running backtest...")
    result = engine.run(
        data=data,
        strategy_func=simple_moving_average_strategy,
        symbol="BTC/USDT"
    )
    
    # Display results
    print("\n" + "=" * 60)
    print("BACKTEST RESULTS")
    print("=" * 60)
    print(f"\n📈 Performance:")
    print(f"   Initial Capital:    ${result.initial_capital:,.2f}")
    print(f"   Final Capital:      ${result.final_capital:,.2f}")
    print(f"   Total PnL:          ${result.total_pnl:,.2f}")
    print(f"   Total Return:       {result.total_return_pct:.2f}%")
    
    print(f"\n📊 Trade Statistics:")
    print(f"   Total Trades:       {result.total_trades}")
    print(f"   Winning Trades:     {result.winning_trades}")
    print(f"   Losing Trades:      {result.losing_trades}")
    print(f"   Win Rate:           {result.win_rate:.2f}%")
    
    print(f"\n⚠️  Risk Metrics:")
    print(f"   Max Drawdown:       {result.max_drawdown:.2f}%")
    print(f"   Sharpe Ratio:       {result.sharpe_ratio:.2f}")
    
    if result.trades:
        print(f"\n📋 Recent Trades (last 5):")
        for trade in result.trades[-5:]:
            pnl_sign = "+" if trade.pnl > 0 else ""
            print(f"   {trade.side.upper():<4} {trade.quantity:.4f} BTC @ ${trade.entry_price:,.2f}")
            print(f"        → EXIT @ ${trade.exit_price:,.2f} | PnL: {pnl_sign}${trade.pnl:.2f} ({pnl_sign}{trade.pnl_percent:.2f}%)")
    
    print("\n" + "=" * 60)
    print("✅ Backtest completed successfully!")
    print("=" * 60)
    
    return result


if __name__ == "__main__":
    main()
