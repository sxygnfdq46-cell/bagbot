"""Backtesting engine for simulating strategy execution against historical data."""

import pandas as pd
from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal


@dataclass
class Position:
    """Represents an open position."""
    symbol: str
    side: str  # 'buy' or 'sell'
    entry_price: float
    quantity: float
    entry_time: datetime
    
    def unrealized_pnl(self, current_price: float) -> float:
        """Calculate unrealized PnL."""
        if self.side == 'buy':
            return (current_price - self.entry_price) * self.quantity
        else:  # sell/short
            return (self.entry_price - current_price) * self.quantity


@dataclass
class Trade:
    """Represents a completed trade."""
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    quantity: float
    entry_time: datetime
    exit_time: datetime
    pnl: float
    pnl_percent: float


@dataclass
class BacktestResult:
    """Results from a backtest run."""
    initial_capital: float
    final_capital: float
    total_pnl: float
    total_return_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    trades: List[Trade] = field(default_factory=list)
    equity_curve: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary."""
        return {
            "initial_capital": self.initial_capital,
            "final_capital": self.final_capital,
            "total_pnl": self.total_pnl,
            "total_return_pct": self.total_return_pct,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate": self.win_rate,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "trades": [
                {
                    "symbol": t.symbol,
                    "side": t.side,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "quantity": t.quantity,
                    "entry_time": t.entry_time.isoformat(),
                    "exit_time": t.exit_time.isoformat(),
                    "pnl": t.pnl,
                    "pnl_percent": t.pnl_percent,
                }
                for t in self.trades
            ],
            "equity_curve": self.equity_curve,
        }


class MockConnector:
    """Mock exchange connector for backtesting.
    
    Simulates order execution using historical price data.
    """
    
    def __init__(self, initial_balance: float = 10000.0):
        self.balance = {"USDT": initial_balance}
        self.positions: Dict[str, Position] = {}
        self.orders: List[Dict[str, Any]] = []
        
    async def fetch_balance(self) -> Dict[str, Any]:
        """Return current balance."""
        return {
            asset: {"free": amount, "used": 0.0, "total": amount}
            for asset, amount in self.balance.items()
        }
    
    async def create_order(self, order_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate order execution."""
        symbol = order_payload["symbol"]
        side = order_payload["side"]
        amount = order_payload["amount"]
        order_type = order_payload.get("type", "market")
        price = order_payload.get("price", 0.0)
        
        # Generate order ID
        order_id = f"backtest_{len(self.orders) + 1}"
        
        order = {
            "id": order_id,
            "symbol": symbol,
            "side": side,
            "type": order_type,
            "amount": amount,
            "price": price,
            "status": "filled",
            "filled": amount,
            "timestamp": datetime.now().isoformat(),
        }
        
        self.orders.append(order)
        return order
    
    def execute_trade(self, symbol: str, side: str, price: float, quantity: float, timestamp: datetime) -> Optional[Trade]:
        """Execute a trade and update positions/balance.
        
        Args:
            symbol: Trading pair (e.g., "BTC/USDT")
            side: "buy" or "sell"
            price: Execution price
            quantity: Trade quantity
            timestamp: Execution timestamp
            
        Returns:
            Trade object if position was closed, None otherwise
        """
        base_asset = symbol.split("/")[0]
        quote_asset = symbol.split("/")[1]
        
        # Initialize balances if not present
        if base_asset not in self.balance:
            self.balance[base_asset] = 0.0
        if quote_asset not in self.balance:
            self.balance[quote_asset] = 0.0
        
        completed_trade = None
        
        if side == "buy":
            cost = price * quantity
            if self.balance.get(quote_asset, 0) >= cost:
                # Execute buy
                self.balance[quote_asset] -= cost
                self.balance[base_asset] = self.balance.get(base_asset, 0) + quantity
                
                # Check if closing a short position
                if symbol in self.positions and self.positions[symbol].side == "sell":
                    pos = self.positions[symbol]
                    pnl = pos.unrealized_pnl(price)
                    pnl_pct = (pnl / (pos.entry_price * pos.quantity)) * 100
                    
                    completed_trade = Trade(
                        symbol=symbol,
                        side=pos.side,
                        entry_price=pos.entry_price,
                        exit_price=price,
                        quantity=pos.quantity,
                        entry_time=pos.entry_time,
                        exit_time=timestamp,
                        pnl=pnl,
                        pnl_percent=pnl_pct,
                    )
                    del self.positions[symbol]
                else:
                    # Open new long position
                    self.positions[symbol] = Position(
                        symbol=symbol,
                        side="buy",
                        entry_price=price,
                        quantity=quantity,
                        entry_time=timestamp,
                    )
        
        elif side == "sell":
            if self.balance.get(base_asset, 0) >= quantity:
                # Execute sell
                self.balance[base_asset] -= quantity
                self.balance[quote_asset] = self.balance.get(quote_asset, 0) + (price * quantity)
                
                # Check if closing a long position
                if symbol in self.positions and self.positions[symbol].side == "buy":
                    pos = self.positions[symbol]
                    pnl = pos.unrealized_pnl(price)
                    pnl_pct = (pnl / (pos.entry_price * pos.quantity)) * 100
                    
                    completed_trade = Trade(
                        symbol=symbol,
                        side=pos.side,
                        entry_price=pos.entry_price,
                        exit_price=price,
                        quantity=pos.quantity,
                        entry_time=pos.entry_time,
                        exit_time=timestamp,
                        pnl=pnl,
                        pnl_percent=pnl_pct,
                    )
                    del self.positions[symbol]
                else:
                    # Open new short position
                    self.positions[symbol] = Position(
                        symbol=symbol,
                        side="sell",
                        entry_price=price,
                        quantity=quantity,
                        entry_time=timestamp,
                    )
        
        return completed_trade
    
    def get_total_equity(self, current_prices: Dict[str, float]) -> float:
        """Calculate total portfolio equity including unrealized PnL."""
        total = self.balance.get("USDT", 0)
        
        # Add value of assets (only if not in an open position to avoid double counting)
        for asset, amount in self.balance.items():
            if asset != "USDT" and amount > 0:
                symbol = f"{asset}/USDT"
                # Only count if we don't have an open position for this symbol
                # Positions already account for the asset value
                if symbol not in self.positions and symbol in current_prices:
                    total += amount * current_prices[symbol]
        
        # Add value from open positions (includes unrealized PnL)
        for symbol, pos in self.positions.items():
            if symbol in current_prices:
                # For long positions: count the current value of the assets
                # For short positions: count the unrealized PnL
                if pos.side == "buy":
                    total += pos.quantity * current_prices[symbol]
                else:  # short position
                    total += pos.unrealized_pnl(current_prices[symbol])
        
        return total


class BacktestEngine:
    """Engine for backtesting trading strategies against historical data."""
    
    def __init__(self, initial_capital: float = 10000.0):
        """Initialize backtest engine.
        
        Args:
            initial_capital: Starting capital in USDT
        """
        self.initial_capital = initial_capital
        self.connector = MockConnector(initial_capital)
        self.trades: List[Trade] = []
        self.equity_curve: List[Dict[str, Any]] = []
        
    def run(
        self,
        data: pd.DataFrame,
        strategy_func: Callable[[pd.DataFrame, int, MockConnector], Optional[Dict[str, Any]]],
        symbol: str = "BTC/USDT",
    ) -> BacktestResult:
        """Run backtest on historical data.
        
        Args:
            data: DataFrame with columns [timestamp, open, high, low, close, volume]
            strategy_func: Strategy function that takes (data, current_index, connector)
                          and returns order dict or None
            symbol: Trading pair symbol
            
        Returns:
            BacktestResult with performance metrics
        """
        # Reset state
        self.connector = MockConnector(self.initial_capital)
        self.trades = []
        self.equity_curve = []
        
        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(data['timestamp']):
            data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        # Iterate through each bar
        for i in range(len(data)):
            row = data.iloc[i]
            current_price = row['close']
            timestamp = row['timestamp']
            
            # Track equity
            current_prices = {symbol: current_price}
            equity = self.connector.get_total_equity(current_prices)
            self.equity_curve.append({
                "timestamp": timestamp.isoformat() if isinstance(timestamp, pd.Timestamp) else str(timestamp),
                "equity": equity,
                "price": current_price,
            })
            
            # Get strategy signal
            signal = strategy_func(data, i, self.connector)
            
            # Execute signal if present
            if signal:
                side = signal.get("side")
                quantity = signal.get("quantity", 0.0)
                
                if side and quantity > 0:
                    trade = self.connector.execute_trade(
                        symbol=symbol,
                        side=side,
                        price=current_price,
                        quantity=quantity,
                        timestamp=timestamp,
                    )
                    
                    if trade:
                        self.trades.append(trade)
        
        # Calculate metrics
        return self._calculate_results()
    
    def _calculate_results(self) -> BacktestResult:
        """Calculate backtest performance metrics."""
        final_capital = self.connector.balance.get("USDT", 0)
        
        # Add value of remaining assets
        for asset, amount in self.connector.balance.items():
            if asset != "USDT" and amount > 0:
                # Use last known price from equity curve
                if self.equity_curve:
                    final_capital = self.equity_curve[-1]["equity"]
        
        total_pnl = final_capital - self.initial_capital
        total_return_pct = (total_pnl / self.initial_capital) * 100
        
        # Trade statistics
        total_trades = len(self.trades)
        winning_trades = sum(1 for t in self.trades if t.pnl > 0)
        losing_trades = sum(1 for t in self.trades if t.pnl < 0)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate max drawdown
        max_drawdown = self._calculate_max_drawdown()
        
        # Calculate Sharpe ratio
        sharpe_ratio = self._calculate_sharpe_ratio()
        
        return BacktestResult(
            initial_capital=self.initial_capital,
            final_capital=final_capital,
            total_pnl=total_pnl,
            total_return_pct=total_return_pct,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            trades=self.trades,
            equity_curve=self.equity_curve,
        )
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown from equity curve."""
        if not self.equity_curve:
            return 0.0
        
        equity_values = [point["equity"] for point in self.equity_curve]
        peak = equity_values[0]
        max_dd = 0.0
        
        for equity in equity_values:
            if equity > peak:
                peak = equity
            dd = (peak - equity) / peak * 100
            if dd > max_dd:
                max_dd = dd
        
        return max_dd
    
    def _calculate_sharpe_ratio(self) -> float:
        """Calculate Sharpe ratio (simplified, assuming 0% risk-free rate)."""
        if len(self.equity_curve) < 2:
            return 0.0
        
        # Calculate returns
        equity_values = [point["equity"] for point in self.equity_curve]
        returns = []
        for i in range(1, len(equity_values)):
            ret = (equity_values[i] - equity_values[i-1]) / equity_values[i-1]
            returns.append(ret)
        
        if not returns:
            return 0.0
        
        # Calculate Sharpe
        import numpy as np
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.0
        
        # Annualized Sharpe (assuming daily data, scale by sqrt(365))
        sharpe = (mean_return / std_return) * np.sqrt(365)
        return sharpe
