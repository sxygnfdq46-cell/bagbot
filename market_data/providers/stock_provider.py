"""Delayed/public stock provider (read-only, deterministic)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from market_data.normalizer import normalize_candle, normalize_price
from market_data.provider_base import AssetClass, CandleData, MarketDataProvider, PriceData

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
        logger.info(message, extra={"market_data": kwargs})
    except Exception:
        return


class StockDelayedProvider(MarketDataProvider):
    """Deterministic, delayed-style stock data (mocked, no execution)."""

    def __init__(self, *, metrics_client: Any = None) -> None:
        self.metrics = metrics_client
        self._prices: Dict[str, float] = {
            "AAPL": 190.0,
            "MSFT": 380.0,
        }

    def get_price(self, symbol: str, asset_class: AssetClass, *, trace_id: Optional[str] = None) -> PriceData:
        try:
            if asset_class != "stock":
                raise ValueError("asset_class must be stock for StockDelayedProvider")
            price = self._prices.get(symbol)
            if price is None:
                raise KeyError(f"symbol {symbol} unsupported")
            _safe_inc(self.metrics, "market_ticks_total", {"asset_class": asset_class})
            _safe_inc(self.metrics, "market_symbols_active", {"symbol": symbol, "asset_class": asset_class})
            return normalize_price(symbol=symbol, asset_class=asset_class, price=price, timestamp=0.0, trace_id=trace_id)
        except Exception:
            _safe_inc(self.metrics, "market_provider_errors_total", {"provider": "stock"})
            _safe_log("stock price fetch failed", symbol=symbol, trace_id=trace_id)
            raise

    def get_candles(
        self,
        symbol: str,
        asset_class: AssetClass,
        timeframe: str,
        limit: int,
        *,
        trace_id: Optional[str] = None,
    ) -> List[CandleData]:
        try:
            if asset_class != "stock":
                raise ValueError("asset_class must be stock for StockDelayedProvider")
            price = self._prices.get(symbol)
            if price is None:
                raise KeyError(f"symbol {symbol} unsupported")
            candles: List[CandleData] = []
            base = price
            for i in range(limit):
                open_p = base + i * 0.5
                close_p = open_p + 0.25
                high_p = close_p + 0.1
                low_p = open_p - 0.1
                volume = 1_000_000 + i * 50_000
                candles.append(
                    normalize_candle(
                        symbol=symbol,
                        asset_class=asset_class,
                        timeframe=timeframe,
                        open=open_p,
                        high=high_p,
                        low=low_p,
                        close=close_p,
                        volume=volume,
                        timestamp=float(i),
                        trace_id=trace_id,
                    )
                )
            _safe_inc(self.metrics, "market_candles_total", {"asset_class": asset_class})
            _safe_inc(self.metrics, "market_symbols_active", {"symbol": symbol, "asset_class": asset_class})
            return candles
        except Exception:
            _safe_inc(self.metrics, "market_provider_errors_total", {"provider": "stock"})
            _safe_log("stock candles fetch failed", symbol=symbol, trace_id=trace_id)
            raise


__all__ = ["StockDelayedProvider"]
