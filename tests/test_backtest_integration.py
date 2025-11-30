"""Small integration test: load sample CSV, run ReplayEngine to feed minimal Brain stub, assert trade_history populated and equity_history length equals number of ticks."""
import tempfile
import os


def test_backtest_integration():
    """Integration test with sample CSV and strategy stub."""
    from backtest.loader import load_candles
    from backtest.replay import ReplayEngine
    from backtest.executor import BacktestExecutor
    
    # Create sample CSV
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
2024-01-01T03:00:00,102.0,104.0,101.0,103.0,2500.0
2024-01-01T04:00:00,103.0,105.0,102.0,104.0,3000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        # Load candles
        candles = load_candles(temp_path)
        assert len(candles) == 5
        
        # Create stub account and strategy
        class StubAccount:
            def __init__(self):
                self.equity_history = []
                self.trade_history = []
            
            def execute_order(self, order):
                # Record every Nth tick as a trade (deterministic)
                self.trade_history.append({"symbol": order.get("symbol"), "pnl": 10.0})
            
            def update_equity(self, snapshot):
                self.equity_history.append(snapshot)
        
        class StubStrategy:
            def __init__(self):
                self.tick_count = 0
            
            def on_price_update(self, candle):
                self.tick_count += 1
                # Return EXECUTE_ORDER every Nth tick
                if self.tick_count % 2 == 0:
                    return {
                        "type": "EXECUTE_ORDER",
                        "order": {"symbol": "BTCUSDT", "side": "BUY", "size": 1.0, "price": candle["close"]}
                    }
                return None
        
        account = StubAccount()
        strategy = StubStrategy()
        executor = BacktestExecutor(account, strategy)
        
        # Run replay
        replay = ReplayEngine(candles, tick_callback=executor.process_candle)
        replay.run()
        
        # Assert equity_history length equals number of ticks
        assert len(account.equity_history) == 5
        
        # Assert trade_history populated (strategy returns EXECUTE_ORDER on ticks 2 and 4)
        assert len(account.trade_history) == 2
        
    finally:
        os.unlink(temp_path)
