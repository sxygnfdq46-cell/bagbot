"""Tests for backtesting engine."""

import pytest
import pandas as pd
from datetime import datetime
from backtest.engine import BacktestEngine, MockConnector, Position, Trade


@pytest.fixture
def sample_data():
    """Create sample OHLCV data for testing."""
    data = pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=30, freq='1h'),
        'open': [100 + i for i in range(30)],
        'high': [102 + i for i in range(30)],
        'low': [98 + i for i in range(30)],
        'close': [101 + i for i in range(30)],
        'volume': [1000 + i * 10 for i in range(30)],
    })
    return data


@pytest.fixture
def mock_connector():
    """Create mock connector for testing."""
    return MockConnector(initial_balance=10000.0)


class TestMockConnector:
    """Test mock exchange connector."""
    
    @pytest.mark.asyncio
    async def test_fetch_balance(self, mock_connector):
        """Test balance fetching."""
        balance = await mock_connector.fetch_balance()
        
        assert "USDT" in balance
        assert balance["USDT"]["free"] == 10000.0
        assert balance["USDT"]["total"] == 10000.0
    
    @pytest.mark.asyncio
    async def test_create_order(self, mock_connector):
        """Test order creation."""
        order = await mock_connector.create_order({
            "symbol": "BTC/USDT",
            "side": "buy",
            "amount": 0.1,
            "type": "market",
            "price": 42000.0,
        })
        
        assert order["id"].startswith("backtest_")
        assert order["symbol"] == "BTC/USDT"
        assert order["side"] == "buy"
        assert order["status"] == "filled"
        assert order["filled"] == 0.1
    
    def test_execute_buy_trade(self, mock_connector):
        """Test executing a buy trade."""
        initial_usdt = mock_connector.balance["USDT"]
        
        trade = mock_connector.execute_trade(
            symbol="BTC/USDT",
            side="buy",
            price=40000.0,
            quantity=0.1,
            timestamp=datetime(2024, 1, 1),
        )
        
        # Buy should reduce USDT and increase BTC
        assert mock_connector.balance["USDT"] == initial_usdt - (40000.0 * 0.1)
        assert mock_connector.balance["BTC"] == 0.1
        
        # Should open position
        assert "BTC/USDT" in mock_connector.positions
        assert mock_connector.positions["BTC/USDT"].side == "buy"
        
        # Should not return trade (position opened, not closed)
        assert trade is None
    
    def test_execute_sell_trade_closes_position(self, mock_connector):
        """Test selling closes long position."""
        # First buy to open position
        mock_connector.execute_trade(
            symbol="BTC/USDT",
            side="buy",
            price=40000.0,
            quantity=0.1,
            timestamp=datetime(2024, 1, 1),
        )
        
        # Then sell to close
        trade = mock_connector.execute_trade(
            symbol="BTC/USDT",
            side="sell",
            price=42000.0,
            quantity=0.1,
            timestamp=datetime(2024, 1, 2),
        )
        
        # Position should be closed
        assert "BTC/USDT" not in mock_connector.positions
        
        # Should return completed trade
        assert trade is not None
        assert trade.side == "buy"  # Original position side
        assert trade.entry_price == 40000.0
        assert trade.exit_price == 42000.0
        assert trade.pnl == 200.0  # (42000 - 40000) * 0.1
        assert trade.pnl_percent == pytest.approx(5.0, rel=0.01)  # 200 / 4000 * 100
    
    def test_position_unrealized_pnl(self):
        """Test unrealized PnL calculation."""
        long_pos = Position(
            symbol="BTC/USDT",
            side="buy",
            entry_price=40000.0,
            quantity=0.1,
            entry_time=datetime(2024, 1, 1),
        )
        
        # Price goes up
        assert long_pos.unrealized_pnl(42000.0) == 200.0
        
        # Price goes down
        assert long_pos.unrealized_pnl(38000.0) == -200.0
        
        # Short position
        short_pos = Position(
            symbol="BTC/USDT",
            side="sell",
            entry_price=40000.0,
            quantity=0.1,
            entry_time=datetime(2024, 1, 1),
        )
        
        # Price goes up (loss for short)
        assert short_pos.unrealized_pnl(42000.0) == -200.0
        
        # Price goes down (profit for short)
        assert short_pos.unrealized_pnl(38000.0) == 200.0
    
    def test_get_total_equity(self, mock_connector):
        """Test total equity calculation."""
        # Start with 10000 USDT
        equity = mock_connector.get_total_equity({"BTC/USDT": 40000.0})
        assert equity == 10000.0
        
        # Buy 0.1 BTC at 40000 (costs 4000 USDT)
        mock_connector.execute_trade(
            symbol="BTC/USDT",
            side="buy",
            price=40000.0,
            quantity=0.1,
            timestamp=datetime(2024, 1, 1),
        )
        
        # At same price, equity should be same (10000 = 6000 USDT + 0.1 BTC * 40000)
        equity = mock_connector.get_total_equity({"BTC/USDT": 40000.0})
        assert equity == pytest.approx(10000.0, rel=0.01)
        
        # Price goes up to 42000 (10000 = 6000 USDT + 0.1 BTC * 42000 = 6000 + 4200)
        equity = mock_connector.get_total_equity({"BTC/USDT": 42000.0})
        assert equity == pytest.approx(10200.0, rel=0.01)
        
        # Price goes down to 38000 (9800 = 6000 USDT + 0.1 BTC * 38000 = 6000 + 3800)
        equity = mock_connector.get_total_equity({"BTC/USDT": 38000.0})
        assert equity == pytest.approx(9800.0, rel=0.01)


class TestBacktestEngine:
    """Test backtest engine."""
    
    def test_engine_initialization(self):
        """Test engine initialization."""
        engine = BacktestEngine(initial_capital=5000.0)
        
        assert engine.initial_capital == 5000.0
        assert engine.connector.balance["USDT"] == 5000.0
        assert len(engine.trades) == 0
        assert len(engine.equity_curve) == 0
    
    def test_simple_strategy_backtest(self, sample_data):
        """Test running a simple strategy."""
        def buy_and_hold(data, i, connector):
            # Buy on first bar, sell on last bar
            if i == 5 and "BTC/USDT" not in connector.positions:
                return {"side": "buy", "quantity": 0.1}
            elif i == 25 and "BTC/USDT" in connector.positions:
                return {"side": "sell", "quantity": 0.1}
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=buy_and_hold,
            symbol="BTC/USDT",
        )
        
        # Should have executed 1 trade (buy -> sell)
        assert result.total_trades == 1
        
        # Should have profit (price increased from 106 to 126)
        assert result.total_pnl > 0
        assert result.total_return_pct > 0
        
        # Should have equity curve
        assert len(result.equity_curve) == len(sample_data)
    
    def test_backtest_result_structure(self, sample_data):
        """Test backtest result has correct structure."""
        def no_trade_strategy(data, i, connector):
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=no_trade_strategy,
            symbol="BTC/USDT",
        )
        
        # Check all required fields
        assert hasattr(result, 'initial_capital')
        assert hasattr(result, 'final_capital')
        assert hasattr(result, 'total_pnl')
        assert hasattr(result, 'total_return_pct')
        assert hasattr(result, 'total_trades')
        assert hasattr(result, 'winning_trades')
        assert hasattr(result, 'losing_trades')
        assert hasattr(result, 'win_rate')
        assert hasattr(result, 'max_drawdown')
        assert hasattr(result, 'sharpe_ratio')
        assert hasattr(result, 'trades')
        assert hasattr(result, 'equity_curve')
        
        # No trades should mean no PnL change
        assert result.total_trades == 0
        assert result.total_pnl == 0
        assert result.winning_trades == 0
        assert result.losing_trades == 0
    
    def test_backtest_result_to_dict(self, sample_data):
        """Test converting result to dictionary."""
        def simple_strategy(data, i, connector):
            if i == 10:
                return {"side": "buy", "quantity": 0.1}
            elif i == 20:
                return {"side": "sell", "quantity": 0.1}
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=simple_strategy,
            symbol="BTC/USDT",
        )
        
        result_dict = result.to_dict()
        
        # Check dictionary structure
        assert "initial_capital" in result_dict
        assert "final_capital" in result_dict
        assert "total_pnl" in result_dict
        assert "total_return_pct" in result_dict
        assert "total_trades" in result_dict
        assert "winning_trades" in result_dict
        assert "losing_trades" in result_dict
        assert "win_rate" in result_dict
        assert "max_drawdown" in result_dict
        assert "sharpe_ratio" in result_dict
        assert "trades" in result_dict
        assert "equity_curve" in result_dict
        
        # Check trades are serialized
        if result_dict["trades"]:
            trade = result_dict["trades"][0]
            assert "symbol" in trade
            assert "side" in trade
            assert "entry_price" in trade
            assert "exit_price" in trade
            assert "pnl" in trade
    
    def test_winning_and_losing_trades(self, sample_data):
        """Test win rate calculation."""
        def multi_trade_strategy(data, i, connector):
            # Make several trades
            if i == 5:  # Buy at 106
                return {"side": "buy", "quantity": 0.1}
            elif i == 10:  # Sell at 111 (win)
                return {"side": "sell", "quantity": 0.1}
            elif i == 15:  # Buy at 116
                return {"side": "buy", "quantity": 0.1}
            elif i == 17:  # Sell at 118 (win)
                return {"side": "sell", "quantity": 0.1}
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=multi_trade_strategy,
            symbol="BTC/USDT",
        )
        
        # Should have 2 trades, both winning
        assert result.total_trades == 2
        assert result.winning_trades == 2
        assert result.losing_trades == 0
        assert result.win_rate == 100.0
    
    def test_max_drawdown_calculation(self, sample_data):
        """Test maximum drawdown calculation."""
        def drawdown_strategy(data, i, connector):
            # Strategy that will have drawdown
            if i == 5:
                return {"side": "buy", "quantity": 0.5}
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=drawdown_strategy,
            symbol="BTC/USDT",
        )
        
        # Should have calculated drawdown
        assert result.max_drawdown >= 0
    
    def test_equity_curve_tracking(self, sample_data):
        """Test equity curve is properly tracked."""
        def simple_strategy(data, i, connector):
            if i == 10:
                return {"side": "buy", "quantity": 0.1}
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=sample_data,
            strategy_func=simple_strategy,
            symbol="BTC/USDT",
        )
        
        # Equity curve should have entry for each bar
        assert len(result.equity_curve) == len(sample_data)
        
        # Each entry should have timestamp, equity, and price
        for point in result.equity_curve:
            assert "timestamp" in point
            assert "equity" in point
            assert "price" in point
        
        # First equity should equal initial capital
        assert result.equity_curve[0]["equity"] == pytest.approx(10000.0, rel=0.01)


class TestBacktestIntegration:
    """Integration tests for complete backtest flow."""
    
    def test_full_backtest_with_sample_data(self):
        """Test complete backtest with actual sample CSV."""
        # Load sample data
        data = pd.read_csv("tests/data/backtest_sample.csv")
        
        def moving_average_crossover(data, i, connector):
            """Simple MA crossover strategy."""
            if i < 10:
                return None
            
            short_ma = data['close'].iloc[i-5:i].mean()
            long_ma = data['close'].iloc[i-10:i].mean()
            
            has_position = "BTC/USDT" in connector.positions
            
            if short_ma > long_ma and not has_position:
                return {"side": "buy", "quantity": 0.1}
            elif short_ma < long_ma and has_position:
                return {"side": "sell", "quantity": 0.1}
            
            return None
        
        engine = BacktestEngine(initial_capital=10000.0)
        result = engine.run(
            data=data,
            strategy_func=moving_average_crossover,
            symbol="BTC/USDT",
        )
        
        # Should complete without errors
        assert result is not None
        assert result.initial_capital == 10000.0
        assert result.final_capital > 0
        
        # Should have valid metrics
        assert isinstance(result.total_trades, int)
        assert isinstance(result.total_pnl, float)
        assert isinstance(result.win_rate, float)
        assert isinstance(result.max_drawdown, float)
        assert isinstance(result.sharpe_ratio, float)
        
        # Equity curve should match data length
        assert len(result.equity_curve) == len(data)
        
        print(f"\n{'='*60}")
        print("INTEGRATION TEST RESULTS")
        print(f"{'='*60}")
        print(f"Initial Capital: ${result.initial_capital:,.2f}")
        print(f"Final Capital:   ${result.final_capital:,.2f}")
        print(f"Total PnL:       ${result.total_pnl:,.2f}")
        print(f"Return:          {result.total_return_pct:.2f}%")
        print(f"Total Trades:    {result.total_trades}")
        print(f"Win Rate:        {result.win_rate:.2f}%")
        print(f"Max Drawdown:    {result.max_drawdown:.2f}%")
        print(f"Sharpe Ratio:    {result.sharpe_ratio:.2f}")
        print(f"{'='*60}\n")
