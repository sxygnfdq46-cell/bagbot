#!/usr/bin/env python3
"""
Backtest runner for AI Fusion Strategy on historical candle data.
Pure Python, no threading, no network calls.
"""

import sys
import json
from backtest.loader import load_candles
from backtest.replay import ReplayEngine
from backtest.executor import BacktestExecutor
from backtest.reporting import generate_report
from worker.strategies.ai_fusion import AIFusionStrategy, AIFusionConfig
from worker.executor.account import VirtualAccount


def main():
    """Run backtest on historical data."""
    
    # 1. Load candles from CSV
    print("Loading candles...")
    candles = load_candles("tests/data/BTCSTUSDT-1h-merged.csv")
    print(f"Loaded {len(candles)} candles")
    
    # 2. Create strategy, account, and executor
    print("Initializing backtest components...")
    
    # Check if genome file provided as argument
    if len(sys.argv) > 1:
        genome_file = sys.argv[1]
        print(f"Loading config from {genome_file}...")
        with open(genome_file, 'r') as f:
            genome_data = json.load(f)
        
        # Map genome fields to AIFusionConfig fields
        config = AIFusionConfig(
            sma_short=genome_data.get('sma_short', 10),
            sma_long=genome_data.get('sma_long', 49),
            ema_short=genome_data.get('ema_short', 7),
            ema_long=genome_data.get('ema_long', 47),
            rsi_period=genome_data.get('rsi_period', 24),
            macd_fast=genome_data.get('macd_fast', 10),
            macd_slow=genome_data.get('macd_slow', 18),
            macd_signal=genome_data.get('macd_signal', 8),
            atr_period=genome_data.get('atr_period', 16),
            risk_per_trade_pct=genome_data.get('risk_per_trade_pct', 0.0025),
            max_position_pct=genome_data.get('max_position_pct', 0.0103),
            volatility_atr_threshold=genome_data.get('volatility_threshold', 0.429),
            trailing_atr_multiplier=genome_data.get('trailing_stop_atr_mul', 2.34),
        )
        if 'sharpe' in genome_data:
            print(f"Config loaded: Sharpe={genome_data['sharpe']:.2f}, MaxDD={genome_data.get('max_drawdown', 0):.2%}")
        else:
            print("Config loaded successfully")
    else:
        config = AIFusionConfig()
        print("Using default config")
    
    strategy = AIFusionStrategy(config)
    account = VirtualAccount(starting_balance=10000.0)
    executor = BacktestExecutor(account, strategy)
    
    # 3. Create replay engine with executor.process_candle as callback
    print("Running backtest...")
    replay = ReplayEngine(candles, tick_callback=executor.process_candle)
    
    # 4. Run the entire backtest
    replay.run()
    
    # 5. Generate and print final report
    print("\n" + "="*60)
    print("BACKTEST RESULTS")
    print("="*60)
    
    # equity_history is now a list of floats (after optimizer update)
    equity_history = getattr(account, 'equity_history', [])
    # Handle both list[float] and list[dict] formats for backward compatibility
    if equity_history and len(equity_history) > 0:
        if isinstance(equity_history[0], dict):
            equity_series = [e.get('price', 10000.0) for e in equity_history]
        else:
            equity_series = equity_history
    else:
        equity_series = []
    
    report = generate_report(
        trade_history=getattr(account, 'trade_history', []),
        equity_history=equity_series
    )
    
    print(f"\nTotal Trades: {report['num_trades']}")
    print(f"Win Rate: {report['win_rate']:.2%}" if report['win_rate'] is not None else "Win Rate: N/A")
    print(f"Total Return: {report['total_return']:.2%}")
    print(f"Max Drawdown: {report['max_drawdown']:.2%}")
    print(f"Sharpe Ratio: {report['sharpe']:.3f}" if report['sharpe'] is not None else "Sharpe Ratio: N/A")
    
    print(f"\nFinal Balance: ${account.balance:.2f}")
    print(f"Equity Points: {len(account.equity_history)}")
    print("\n" + "="*60)


if __name__ == "__main__":
    main()
