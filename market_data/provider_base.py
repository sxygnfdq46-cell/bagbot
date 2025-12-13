"""Read-only market data provider abstractions (no execution)."""
from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import List, Literal, Optional

AssetClass = Literal["crypto", "forex", "stock"]


@dataclass
class PriceData:
    symbol: str
    asset_class: AssetClass
    price: float
    timestamp: float
    trace_id: Optional[str] = None


@dataclass
class CandleData:
    symbol: str
    asset_class: AssetClass
    timeframe: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: float
    trace_id: Optional[str] = None


class MarketDataProvider(abc.ABC):
    """Abstract, read-only provider interface. No execution methods allowed."""

    @abc.abstractmethod
    def get_price(self, symbol: str, asset_class: AssetClass, *, trace_id: Optional[str] = None) -> PriceData:
        raise NotImplementedError

    @abc.abstractmethod
    def get_candles(
        self,
        symbol: str,
        asset_class: AssetClass,
        timeframe: str,
        limit: int,
        *,
        trace_id: Optional[str] = None,
    ) -> List[CandleData]:
        raise NotImplementedError

    def subscribe(self, symbols: List[str], timeframe: str):  # pragma: no cover - optional hook
        raise NotImplementedError("subscription is optional and pull-based by default")


__all__ = ["MarketDataProvider", "PriceData", "CandleData", "AssetClass"]
