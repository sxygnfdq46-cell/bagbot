"""Normalization helpers for read-only market data across asset classes."""
from __future__ import annotations

from typing import Optional

from market_data.provider_base import AssetClass, CandleData, PriceData


def normalize_price(
    *,
    symbol: str,
    asset_class: AssetClass,
    price: float,
    timestamp: float,
    trace_id: Optional[str] = None,
) -> PriceData:
    return PriceData(
        symbol=symbol,
        asset_class=asset_class,
        price=float(price),
        timestamp=float(timestamp),
        trace_id=trace_id,
    )


def normalize_candle(
    *,
    symbol: str,
    asset_class: AssetClass,
    timeframe: str,
    open: float,
    high: float,
    low: float,
    close: float,
    volume: float,
    timestamp: float,
    trace_id: Optional[str] = None,
) -> CandleData:
    return CandleData(
        symbol=symbol,
        asset_class=asset_class,
        timeframe=timeframe,
        open=float(open),
        high=float(high),
        low=float(low),
        close=float(close),
        volume=float(volume),
        timestamp=float(timestamp),
        trace_id=trace_id,
    )


__all__ = ["normalize_price", "normalize_candle"]
