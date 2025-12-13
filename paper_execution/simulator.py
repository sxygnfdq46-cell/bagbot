"""Paper execution simulator (broker-free, deterministic)."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from market_data.provider_base import PriceData
from paper_execution.models import ExecutionResult, FillDetail, OrderIntent
from paper_execution.portfolio import Portfolio

logger = logging.getLogger(__name__)


def _safe_inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:
            return


def _safe_log(message: str, **kwargs: Any) -> None:
    try:
        logger.info(message, extra={"paper_execution": kwargs})
    except Exception:
        return


@dataclass
class SimulationConfig:
    slippage_bps: float = 0.0
    fee_bps: float = 0.0
    fee_flat: float = 0.0
    latency_ms: int = 0


class PaperExecutionSimulator:
    def __init__(self, portfolio: Optional[Portfolio] = None, *, config: Optional[SimulationConfig] = None, metrics_client: Any = None) -> None:
        self.portfolio = portfolio or Portfolio()
        self.config = config or SimulationConfig()
        self.metrics = metrics_client

    def reset(self) -> None:
        self.portfolio.reset()

    def _apply_slippage(self, price: float, side: str) -> (float, float):
        bps = self.config.slippage_bps / 10_000.0
        if side == "buy":
            slipped = price * (1 + bps)
            return slipped, (slipped - price)
        if side == "sell":
            slipped = price * (1 - bps)
            return slipped, (price - slipped)
        return price, 0.0

    def _fees(self, price: float, qty: float) -> float:
        fee_notional = price * qty * (self.config.fee_bps / 10_000.0)
        return fee_notional + self.config.fee_flat

    def execute(self, intent: OrderIntent, market: PriceData, *, timestamp: float = 0.0) -> ExecutionResult:
        _safe_inc(self.metrics, "paper_orders_total", {"side": intent.side, "asset_class": intent.asset_class})
        if intent.side == "hold" or intent.quantity <= 0:
            return ExecutionResult(intent=intent, fill=None, realized_pnl=0.0, cash_balance=self.portfolio.cash, position_qty=self.portfolio.positions.get(intent.symbol, None).quantity if intent.symbol in self.portfolio.positions else 0.0, avg_price=self.portfolio.positions.get(intent.symbol, None).avg_price if intent.symbol in self.portfolio.positions else 0.0, trace_id=intent.trace_id)

        if market.asset_class != intent.asset_class:
            raise ValueError("asset class mismatch")
        if market.symbol != intent.symbol:
            raise ValueError("symbol mismatch")

        price, slip_cost = self._apply_slippage(market.price, intent.side)
        fees = self._fees(price, intent.quantity)
        fill = FillDetail(
            symbol=intent.symbol,
            asset_class=intent.asset_class,
            side=intent.side,
            quantity=intent.quantity,
            price=price,
            fees=fees,
            slippage_cost=slip_cost * intent.quantity,
            timestamp=timestamp,
            trace_id=intent.trace_id or market.trace_id,
        )

        self.portfolio.apply_fill(fill)
        pos = self.portfolio.positions.get(intent.symbol)
        position_qty = pos.quantity if pos else 0.0
        avg_price = pos.avg_price if pos else 0.0
        realized = self.portfolio.realized_pnl

        _safe_inc(self.metrics, "paper_fills_total", {"side": intent.side, "asset_class": intent.asset_class})
        _safe_inc(self.metrics, "paper_slippage_bps", {"asset_class": intent.asset_class})
        _safe_inc(self.metrics, "paper_fees_total", {"asset_class": intent.asset_class})
        _safe_inc(self.metrics, "paper_positions_open", {"asset_class": intent.asset_class})
        _safe_inc(self.metrics, "paper_pnl_total", {"asset_class": intent.asset_class})
        _safe_log(
            "paper order filled",
            symbol=intent.symbol,
            side=intent.side,
            qty=intent.quantity,
            price=price,
            fees=fees,
            trace_id=fill.trace_id,
        )

        return ExecutionResult(
            intent=intent,
            fill=fill,
            realized_pnl=realized,
            cash_balance=self.portfolio.cash,
            position_qty=position_qty,
            avg_price=avg_price,
            trace_id=fill.trace_id,
        )


__all__ = ["PaperExecutionSimulator", "SimulationConfig"]
