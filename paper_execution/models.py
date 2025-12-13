"""Paper execution data models (deterministic, broker-free)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

from market_data.provider_base import AssetClass

Side = Literal["buy", "sell", "hold"]
OrderType = Literal["market", "limit"]


@dataclass
class OrderIntent:
    symbol: str
    asset_class: AssetClass
    side: Side
    quantity: float
    order_type: OrderType = "market"
    limit_price: Optional[float] = None
    trace_id: Optional[str] = None


@dataclass
class FillDetail:
    symbol: str
    asset_class: AssetClass
    side: Side
    quantity: float
    price: float
    fees: float
    slippage_cost: float
    timestamp: float
    trace_id: Optional[str] = None


@dataclass
class ExecutionResult:
    intent: OrderIntent
    fill: Optional[FillDetail]
    realized_pnl: float
    cash_balance: float
    position_qty: float
    avg_price: float
    trace_id: Optional[str] = None


__all__ = ["OrderIntent", "FillDetail", "ExecutionResult", "Side", "OrderType"]
