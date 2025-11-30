"""
Backtester Skeleton
Framework for running trading strategies against historical data
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SignalType(Enum):
    """Trading signal types"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass
class Trade:
    """Represents a single trade"""
    timestamp: datetime
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: float
    price: float
    value: float


@dataclass
class Position:
    """Represents current position"""
    symbol: str
    quantity: float
    entry_price: float
    entry_timestamp: datetime
    current_price: float
    unrealized_pnl: float


@dataclass
class BacktestResult:
    """Results from backtest execution"""
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


class Strategy:
    """
    Base strategy class
    Override generate_signals() to implement custom strategies
    """
    
    def __init__(self, name: str = "BaseStrategy"):
        self.name = name
        self.parameters = {}
    
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """
        Generate trading signals from OHLC data
        
        Args:
            data: DataFrame with columns [open, high, low, close, volume]
        
        Returns:
            Series with signals: 1 (buy), -1 (sell), 0 (hold)
        """
        raise NotImplementedError("Override generate_signals() in your strategy")
    
    def set_parameters(self, **kwargs):
        """Set strategy parameters"""
        self.parameters.update(kwargs)


class SimpleMovingAverageStrategy(Strategy):
    """
    Example SMA crossover strategy
    Buys when fast SMA crosses above slow SMA
    Sells when fast SMA crosses below slow SMA
    """
    
    def __init__(self, fast_period: int = 20, slow_period: int = 50):
        super().__init__(name="SMA_Crossover")
        self.fast_period = fast_period
        self.slow_period = slow_period
    
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """Generate SMA crossover signals"""
        # Calculate moving averages
        fast_sma = data['close'].rolling(window=self.fast_period).mean()
        slow_sma = data['close'].rolling(window=self.slow_period).mean()
        
        # Generate signals
        signals = pd.Series(0, index=data.index)
        
        # Buy when fast crosses above slow
        signals[(fast_sma > slow_sma) & (fast_sma.shift(1) <= slow_sma.shift(1))] = 1
        
        # Sell when fast crosses below slow
        signals[(fast_sma < slow_sma) & (fast_sma.shift(1) >= slow_sma.shift(1))] = -1
        
        return signals


class Backtester:
    """
    Backtesting engine for strategy evaluation
    """
    
    def __init__(
        self,
        initial_balance: float = 10000.0,
        commission: float = 0.001,  # 0.1%
        slippage: float = 0.0005     # 0.05%
    ):
        """
        Initialize backtester
        
        Args:
            initial_balance: Starting capital
            commission: Commission rate per trade
            slippage: Slippage rate (price impact)
        """
        self.initial_balance = initial_balance
        self.commission = commission
        self.slippage = slippage
    
    def run(
        self,
        strategy: Strategy,
        data: pd.DataFrame,
        symbol: str = "BTC/USDT"
    ) -> BacktestResult:
        """
        Run backtest on historical data
        
        Args:
            strategy: Trading strategy to test
            data: OHLC DataFrame with columns [open, high, low, close, volume, timestamp]
            symbol: Trading pair symbol
        
        Returns:
            BacktestResult with performance metrics
        """
        logger.info(f"Running backtest for {strategy.name} on {symbol}")
        logger.info(f"Data range: {data.index[0]} to {data.index[-1]} ({len(data)} bars)")
        
        # Validate data
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain columns: {required_columns}")
        
        # Generate signals
        signals = strategy.generate_signals(data)
        
        # Initialize tracking variables
        balance = self.initial_balance
        position = None
        trades: List[Trade] = []
        equity = []
        
        # Iterate through data
        for i in range(len(data)):
            timestamp = data.index[i]
            price = data['close'].iloc[i]
            signal = signals.iloc[i]
            
            # Calculate current equity
            current_equity = balance
            if position:
                position.current_price = price
                position.unrealized_pnl = (price - position.entry_price) * position.quantity
                current_equity += position.unrealized_pnl
            
            equity.append({
                'timestamp': timestamp,
                'balance': balance,
                'position_value': position.unrealized_pnl if position else 0,
                'total_equity': current_equity
            })
            
            # Execute trades based on signals
            if signal == 1 and position is None:  # Buy signal
                # Open long position
                quantity = (balance * 0.95) / price  # Use 95% of balance
                buy_price = price * (1 + self.slippage)
                cost = quantity * buy_price
                fee = cost * self.commission
                
                if balance >= cost + fee:
                    position = Position(
                        symbol=symbol,
                        quantity=quantity,
                        entry_price=buy_price,
                        entry_timestamp=timestamp,
                        current_price=buy_price,
                        unrealized_pnl=0
                    )
                    
                    balance -= (cost + fee)
                    
                    trades.append(Trade(
                        timestamp=timestamp,
                        symbol=symbol,
                        side='buy',
                        quantity=quantity,
                        price=buy_price,
                        value=cost + fee
                    ))
                    
                    logger.debug(f"{timestamp}: BUY {quantity:.8f} @ {buy_price:.2f}")
            
            elif signal == -1 and position is not None:  # Sell signal
                # Close long position
                sell_price = price * (1 - self.slippage)
                proceeds = position.quantity * sell_price
                fee = proceeds * self.commission
                
                balance += (proceeds - fee)
                
                trades.append(Trade(
                    timestamp=timestamp,
                    symbol=symbol,
                    side='sell',
                    quantity=position.quantity,
                    price=sell_price,
                    value=proceeds - fee
                ))
                
                logger.debug(f"{timestamp}: SELL {position.quantity:.8f} @ {sell_price:.2f}")
                
                position = None
        
        # Close any open position at end
        if position:
            final_price = data['close'].iloc[-1]
            sell_price = final_price * (1 - self.slippage)
            proceeds = position.quantity * sell_price
            fee = proceeds * self.commission
            balance += (proceeds - fee)
            
            trades.append(Trade(
                timestamp=data.index[-1],
                symbol=symbol,
                side='sell',
                quantity=position.quantity,
                price=sell_price,
                value=proceeds - fee
            ))
        
        # Calculate metrics
        equity_df = pd.DataFrame(equity)
        result = self._calculate_metrics(
            equity_df, trades, self.initial_balance, balance
        )
        
        logger.info(f"Backtest complete: {result.total_trades} trades, "
                   f"{result.total_return_pct:.2f}% return, "
                   f"{result.win_rate:.2f}% win rate")
        
        return result
    
    def _calculate_metrics(
        self,
        equity_df: pd.DataFrame,
        trades: List[Trade],
        initial_balance: float,
        final_balance: float
    ) -> BacktestResult:
        """Calculate performance metrics"""
        # Basic metrics
        total_return = final_balance - initial_balance
        total_return_pct = (total_return / initial_balance) * 100
        
        # Trade analysis
        total_trades = len(trades)
        buy_trades = [t for t in trades if t.side == 'buy']
        sell_trades = [t for t in trades if t.side == 'sell']
        
        # Calculate P&L per trade pair
        winning_trades = 0
        losing_trades = 0
        
        for i in range(min(len(buy_trades), len(sell_trades))):
            buy = buy_trades[i]
            sell = sell_trades[i]
            pnl = (sell.price - buy.price) * buy.quantity
            
            if pnl > 0:
                winning_trades += 1
            else:
                losing_trades += 1
        
        win_rate = (winning_trades / len(buy_trades) * 100) if buy_trades else 0
        
        # Drawdown calculation
        equity_curve = equity_df['total_equity'].values
        running_max = np.maximum.accumulate(equity_curve)
        drawdown = (equity_curve - running_max) / running_max
        max_drawdown = abs(drawdown.min()) * 100
        
        # Sharpe ratio (simplified - assumes daily returns)
        returns = equity_df['total_equity'].pct_change().dropna()
        sharpe_ratio = (returns.mean() / returns.std() * np.sqrt(252)) if len(returns) > 0 else 0
        
        # Sortino ratio (downside deviation)
        downside_returns = returns[returns < 0]
        sortino_ratio = (returns.mean() / downside_returns.std() * np.sqrt(252)) if len(downside_returns) > 0 else 0
        
        return BacktestResult(
            initial_balance=initial_balance,
            final_balance=final_balance,
            total_return=total_return,
            total_return_pct=total_return_pct,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            trades=trades,
            equity_curve=equity_df,
            metrics={
                'total_buy_trades': len(buy_trades),
                'total_sell_trades': len(sell_trades),
                'commission_rate': self.commission,
                'slippage_rate': self.slippage
            }
        )


# Example usage function
def example_backtest():
    """Example of running a backtest"""
    # Generate sample data
    dates = pd.date_range('2024-01-01', '2024-12-31', freq='1H')
    np.random.seed(42)
    
    # Simulate price data with trend
    prices = 100 + np.cumsum(np.random.randn(len(dates)) * 0.5)
    
    data = pd.DataFrame({
        'open': prices,
        'high': prices * 1.01,
        'low': prices * 0.99,
        'close': prices,
        'volume': np.random.randint(1000, 10000, len(dates))
    }, index=dates)
    
    # Create strategy and backtester
    strategy = SimpleMovingAverageStrategy(fast_period=20, slow_period=50)
    backtester = Backtester(initial_balance=10000, commission=0.001)
    
    # Run backtest
    result = backtester.run(strategy, data)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Backtest Results: {strategy.name}")
    print(f"{'='*50}")
    print(f"Initial Balance: ${result.initial_balance:,.2f}")
    print(f"Final Balance: ${result.final_balance:,.2f}")
    print(f"Total Return: ${result.total_return:,.2f} ({result.total_return_pct:.2f}%)")
    print(f"Total Trades: {result.total_trades}")
    print(f"Winning Trades: {result.winning_trades}")
    print(f"Losing Trades: {result.losing_trades}")
    print(f"Win Rate: {result.win_rate:.2f}%")
    print(f"Max Drawdown: {result.max_drawdown:.2f}%")
    print(f"Sharpe Ratio: {result.sharpe_ratio:.2f}")
    print(f"Sortino Ratio: {result.sortino_ratio:.2f}")
    print(f"{'='*50}\n")
    
    return result


if __name__ == "__main__":
    example_backtest()
