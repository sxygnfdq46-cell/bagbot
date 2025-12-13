"""In-memory portfolio state for paper execution (resettable)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from paper_execution.models import FillDetail


@dataclass
class Position:
    quantity: float = 0.0
    avg_price: float = 0.0


class Portfolio:
    def __init__(self, *, starting_cash: float = 100_000.0) -> None:
        self.starting_cash = starting_cash
        self.cash = starting_cash
        self.positions: Dict[str, Position] = {}
        self.realized_pnl = 0.0

    def reset(self) -> None:
        self.cash = self.starting_cash
        self.positions.clear()
        self.realized_pnl = 0.0

    def _position(self, symbol: str) -> Position:
        if symbol not in self.positions:
            self.positions[symbol] = Position()
        return self.positions[symbol]

    def apply_fill(self, fill: FillDetail) -> None:
        pos = self._position(fill.symbol)
        qty = fill.quantity if fill.side == "buy" else -fill.quantity
        notional = fill.price * fill.quantity
        if fill.side == "buy":
            total_qty = pos.quantity + fill.quantity
            if total_qty > 0:
                pos.avg_price = (pos.avg_price * pos.quantity + fill.price * fill.quantity) / total_qty
            pos.quantity = total_qty
            self.cash -= notional + fill.fees
        elif fill.side == "sell":
            realized = (fill.price - pos.avg_price) * fill.quantity
            self.realized_pnl += realized
            pos.quantity -= fill.quantity
            self.cash += notional - fill.fees
            if pos.quantity <= 0:
                pos.quantity = 0.0
                pos.avg_price = 0.0

    def mark_to_market(self, symbol: str, price: float) -> float:
        pos = self.positions.get(symbol)
        if not pos or pos.quantity == 0.0:
            return 0.0
        return (price - pos.avg_price) * pos.quantity

    def snapshot(self) -> Dict[str, float]:
        return {
            "cash": self.cash,
            "realized_pnl": self.realized_pnl,
            "positions_open": sum(1 for p in self.positions.values() if p.quantity != 0.0),
        }


__all__ = ["Portfolio", "Position"]
