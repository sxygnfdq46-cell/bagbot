"""Tests for read-only market data abstraction (M13)."""
import pytest

from market_data.normalizer import normalize_candle, normalize_price
from market_data.providers.crypto_provider import CryptoPublicProvider
from market_data.providers.forex_provider import ForexDemoProvider
from market_data.providers.stock_provider import StockDelayedProvider


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_normalization_shapes_and_trace_id():
    trace_id = "trace-123"
    price = normalize_price(symbol="BTC-USD", asset_class="crypto", price=42000, timestamp=1.0, trace_id=trace_id)
    candle = normalize_candle(
        symbol="BTC-USD",
        asset_class="crypto",
        timeframe="1h",
        open=1,
        high=2,
        low=0.5,
        close=1.5,
        volume=10,
        timestamp=2.0,
        trace_id=trace_id,
    )

    assert price.trace_id == trace_id
    assert candle.trace_id == trace_id
    assert candle.asset_class == "crypto"
    assert candle.timeframe == "1h"
    assert candle.high >= candle.low


def test_multi_asset_providers_return_normalized_data():
    metrics = _StubMetrics()
    crypto = CryptoPublicProvider(metrics_client=metrics)
    forex = ForexDemoProvider(metrics_client=metrics)
    stock = StockDelayedProvider(metrics_client=metrics)

    p_crypto = crypto.get_price("BTC-USD", "crypto", trace_id="t1")
    p_forex = forex.get_price("EUR-USD", "forex", trace_id="t2")
    p_stock = stock.get_price("AAPL", "stock", trace_id="t3")

    assert p_crypto.asset_class == "crypto" and p_crypto.price > 0
    assert p_forex.asset_class == "forex" and 0 < p_forex.price < 2
    assert p_stock.asset_class == "stock" and p_stock.symbol == "AAPL"

    candles = crypto.get_candles("BTC-USD", "crypto", "1h", 2, trace_id="t4")
    assert len(candles) == 2
    assert candles[0].symbol == "BTC-USD"
    assert _count(metrics.calls, "market_ticks_total", asset_class="crypto") == 1
    assert _count(metrics.calls, "market_candles_total", asset_class="crypto") == 1


def test_wrong_asset_class_raises_and_counts_errors():
    metrics = _StubMetrics()
    crypto = CryptoPublicProvider(metrics_client=metrics)

    with pytest.raises(ValueError):
        crypto.get_price("BTC-USD", "stock")

    assert _count(metrics.calls, "market_provider_errors_total", provider="crypto") == 1


def test_trace_continuity_and_no_execution_paths():
    crypto = CryptoPublicProvider()
    price = crypto.get_price("BTC-USD", "crypto", trace_id="trace-x")

    assert price.trace_id == "trace-x"
    assert not hasattr(crypto, "place_order")
    with pytest.raises(NotImplementedError):
        crypto.subscribe(["BTC-USD"], "1h")


def test_fake_mock_parity_metrics_optional():
    crypto = CryptoPublicProvider(metrics_client=None)
    price = crypto.get_price("BTC-USD", "crypto")
    candles = crypto.get_candles("BTC-USD", "crypto", "1h", 1)

    assert price.symbol == "BTC-USD"
    assert candles[0].symbol == "BTC-USD"
