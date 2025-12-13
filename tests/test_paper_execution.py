"""Tests for broker-free paper execution simulator (M14)."""
import math

import pytest

from market_data.provider_base import PriceData
from paper_execution.models import OrderIntent
from paper_execution.simulator import PaperExecutionSimulator, SimulationConfig


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def _price(symbol: str, asset_class: str, price: float, trace_id: str = "t"):
    return PriceData(symbol=symbol, asset_class=asset_class, price=price, timestamp=0.0, trace_id=trace_id)


def test_market_buy_slippage_and_fees():
    metrics = _StubMetrics()
    sim = PaperExecutionSimulator(
        config=SimulationConfig(slippage_bps=10, fee_bps=5, fee_flat=1.0),
        metrics_client=metrics,
    )
    intent = OrderIntent(symbol="BTC-USD", asset_class="crypto", side="buy", quantity=1.0, trace_id="trace-buy")

    result = sim.execute(intent, _price("BTC-USD", "crypto", 100.0, trace_id="mkt"), timestamp=1.0)

    assert result.fill is not None
    assert math.isclose(result.fill.price, 100.1, rel_tol=1e-6)
    assert result.fill.fees > 1.0
    assert math.isclose(result.cash_balance, 100_000 - (result.fill.price + result.fill.fees), rel_tol=1e-6)
    assert result.position_qty == 1.0
    assert _count(metrics.calls, "paper_orders_total", asset_class="crypto") == 1
    assert _count(metrics.calls, "paper_fills_total", asset_class="crypto") == 1


def test_sell_realized_pnl_and_avg_price():
    sim = PaperExecutionSimulator(config=SimulationConfig(slippage_bps=10, fee_bps=0.0, fee_flat=0.0))
    buy_intent = OrderIntent(symbol="BTC-USD", asset_class="crypto", side="buy", quantity=2.0, trace_id="trace-b1")
    sim.execute(buy_intent, _price("BTC-USD", "crypto", 100.0, trace_id="m1"))

    sell_intent = OrderIntent(symbol="BTC-USD", asset_class="crypto", side="sell", quantity=1.0, trace_id="trace-s1")
    result = sim.execute(sell_intent, _price("BTC-USD", "crypto", 110.0, trace_id="m2"))

    assert result.fill is not None
    # Sell price after slippage 10bps: 110 * 0.999 = 109.89
    assert math.isclose(result.fill.price, 109.89, rel_tol=1e-6)
    assert result.realized_pnl > 9.0
    assert result.position_qty == 1.0
    assert sim.portfolio.positions["BTC-USD"].avg_price > 0


def test_reset_restores_cash_and_positions():
    sim = PaperExecutionSimulator(config=SimulationConfig(slippage_bps=0.0, fee_bps=0.0))
    intent = OrderIntent(symbol="AAPL", asset_class="stock", side="buy", quantity=5.0)
    sim.execute(intent, _price("AAPL", "stock", 10.0))
    assert sim.portfolio.positions["AAPL"].quantity == 5.0

    sim.reset()

    assert sim.portfolio.cash == sim.portfolio.starting_cash
    assert sim.portfolio.positions == {}
    assert sim.portfolio.realized_pnl == 0.0


def test_hold_intent_has_no_fill_and_preserves_trace():
    sim = PaperExecutionSimulator()
    intent = OrderIntent(symbol="MSFT", asset_class="stock", side="hold", quantity=0.0, trace_id="trace-hold")
    result = sim.execute(intent, _price("MSFT", "stock", 200.0, trace_id="m-trace"))

    assert result.fill is None
    assert result.trace_id == "trace-hold"
    assert not hasattr(sim, "place_order")


def test_fake_mock_parity_with_metrics_none():
    sim = PaperExecutionSimulator(config=SimulationConfig(slippage_bps=0.0, fee_bps=0.0), metrics_client=None)
    intent = OrderIntent(symbol="EUR-USD", asset_class="forex", side="buy", quantity=1.0)

    result = sim.execute(intent, _price("EUR-USD", "forex", 1.1))

    assert result.fill is not None
    assert result.fill.symbol == "EUR-USD"
