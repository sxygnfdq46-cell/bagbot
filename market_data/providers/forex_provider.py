"""Demo/public forex provider (read-only, deterministic)."""
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


class ForexDemoProvider(MarketDataProvider):
    """Deterministic forex prices from a mock aggregated feed."""

    def __init__(self, *, metrics_client: Any = None) -> None:
        self.metrics = metrics_client
        self._prices: Dict[str, float] = {
            "EUR-USD": 1.08,
            "USD-JPY": 150.5,
        }

    def get_price(self, symbol: str, asset_class: AssetClass, *, trace_id: Optional[str] = None) -> PriceData:
        try:
            if asset_class != "forex":
                raise ValueError("asset_class must be forex for ForexDemoProvider")
            price = self._prices.get(symbol)
            if price is None:
                raise KeyError(f"symbol {symbol} unsupported")
            _safe_inc(self.metrics, "market_ticks_total", {"asset_class": asset_class})
            _safe_inc(self.metrics, "market_symbols_active", {"symbol": symbol, "asset_class": asset_class})
            return normalize_price(symbol=symbol, asset_class=asset_class, price=price, timestamp=0.0, trace_id=trace_id)
        except Exception:
            _safe_inc(self.metrics, "market_provider_errors_total", {"provider": "forex"})
            _safe_log("forex price fetch failed", symbol=symbol, trace_id=trace_id)
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
            if asset_class != "forex":
                raise ValueError("asset_class must be forex for ForexDemoProvider")
            price = self._prices.get(symbol)
            if price is None:
                raise KeyError(f"symbol {symbol} unsupported")
            candles: List[CandleData] = []
            base = price
            for i in range(limit):
                open_p = base + i * 0.001
                close_p = open_p + 0.0005
                high_p = close_p + 0.0002
                low_p = open_p - 0.0002
                volume = 1_000_000 + i * 10_000
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
            _safe_inc(self.metrics, "market_provider_errors_total", {"provider": "forex"})
            _safe_log("forex candles fetch failed", symbol=symbol, trace_id=trace_id)
            raise


__all__ = ["ForexDemoProvider"]
