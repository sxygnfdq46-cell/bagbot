"""Tests for BacktestExecutor open/close/update_equity and equity_history appended."""


def test_executor_processes_candles():
    """Test executor calls strategy and updates equity history."""
    from backtest.executor import BacktestExecutor
    
    class MockAccount:
        def __init__(self):
            self.equity_history = []
            self.orders = []
        
        def execute_order(self, order):
            self.orders.append(order)
        
        def update_equity(self, snapshot):
            self.equity_history.append(snapshot)
    
    class MockStrategy:
        def on_price_update(self, candle):
            return None  # No decision
    
    account = MockAccount()
    strategy = MockStrategy()
    executor = BacktestExecutor(account, strategy)
    
    candles = [
        {"timestamp": "1", "open": 100.0, "high": 101.0, "low": 99.0, "close": 100.0},
        {"timestamp": "2", "open": 100.0, "high": 102.0, "low": 100.0, "close": 101.0},
    ]
    
    executor.run(candles)
    
    assert len(account.equity_history) == 2
    assert account.equity_history[0]["price"] == 100.0
    assert account.equity_history[1]["price"] == 101.0


def test_executor_handles_execute_order_decision():
    """Test executor forwards EXECUTE_ORDER decisions to account."""
    from backtest.executor import BacktestExecutor
    
    class MockAccount:
        def __init__(self):
            self.equity_history = []
            self.orders = []
        
        def execute_order(self, order):
            self.orders.append(order)
        
        def update_equity(self, snapshot):
            self.equity_history.append(snapshot)
    
    class MockStrategy:
        def on_price_update(self, candle):
            if candle["close"] > 100.0:
                return {
                    "type": "EXECUTE_ORDER",
                    "order": {"symbol": "BTCUSDT", "side": "BUY", "size": 1.0, "price": candle["close"]}
                }
            return None
    
    account = MockAccount()
    strategy = MockStrategy()
    executor = BacktestExecutor(account, strategy)
    
    candles = [
        {"timestamp": "1", "open": 100.0, "high": 101.0, "low": 99.0, "close": 100.0},
        {"timestamp": "2", "open": 100.0, "high": 102.0, "low": 100.0, "close": 101.0},
    ]
    
    executor.run(candles)
    
    assert len(account.orders) == 1
    assert account.orders[0]["side"] == "BUY"
    assert account.orders[0]["price"] == 101.0
