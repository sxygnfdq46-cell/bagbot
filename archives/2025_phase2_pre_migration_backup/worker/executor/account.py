"""Simple in-memory Account object for execution skeleton (NO real money movement)."""
from typing import List, Optional
from .execution_types import Position

class Account:
    def __init__(self, balance: float = 10000.0, starting_balance: Optional[float] = None):
        """
        Virtual Account initializer.
        - Accepts either 'balance' (existing) or 'starting_balance' (tests expect this kw).
        - If starting_balance is provided, it overrides balance.
        - Initialize positions list and equity_history for executor tests.
        """
        if starting_balance is not None:
            balance = float(starting_balance)
        self.balance = float(balance)
        self.positions: List[Position] = []
        # equity_history expected by tests; keep it empty until updated by executor
        self.equity_history: List[dict] = []
        # trade_history for backtest reporting
        self.trade_history: List[dict] = []

    def open_position(self, position: Position) -> None:
        # purely in-memory: do not perform any checks beyond append
        self.positions.append(position)

    def close_position(self, position: Position) -> None:
        # simplistic remove if present
        try:
            self.positions.remove(position)
        except ValueError:
            pass
    
    def execute_order(self, order: dict) -> None:
        """
        Execute an order (for backtest compatibility).
        Order format: {"side": "BUY"|"SELL", "symbol": str, "price": float, "size": float, ...}
        """
        if not isinstance(order, dict):
            return
        
        side = order.get("side")
        symbol = order.get("symbol", "UNKNOWN")
        price = float(order.get("price", 0))
        size = float(order.get("size", 0))
        
        # Record trade
        trade = {
            "side": side,
            "symbol": symbol,
            "price": price,
            "size": size,
            "timestamp": order.get("timestamp"),
            "pnl": 0.0  # Will be updated when position is closed
        }
        self.trade_history.append(trade)
        
        if side == "BUY":
            # Deduct cost from balance
            cost = price * size
            if cost <= self.balance:
                self.balance -= cost
                position = Position(symbol=symbol, side=side, entry_price=price, size=size)
                self.open_position(position)
        elif side == "SELL":
            # Add proceeds to balance
            proceeds = price * size
            self.balance += proceeds
            position = Position(symbol=symbol, side=side, entry_price=price, size=size)
            self.open_position(position)

    def update_equity(self, snapshot: dict) -> None:
        """
        Update equity history with current balance.
        Called by executor after processing each candle.
        """
        # Store balance as float (not dict) for Sharpe calculation
        self.equity_history.append(float(self.balance))

    def snapshot(self) -> dict:
        """
        Return a snapshot of the current account state.
        Expected by tests to retrieve balance, positions, and equity_history.
        """
        return {
            "balance": self.balance,
            "positions": [{
                "symbol": p.symbol,
                "side": p.side,
                "entry_price": p.entry_price,
                "size": p.size,
                "pnl": p.pnl
            } for p in self.positions],
            "equity_history": list(self.equity_history)
        }

# Backwards compatibility alias used by brain/tests
VirtualAccount = Account
