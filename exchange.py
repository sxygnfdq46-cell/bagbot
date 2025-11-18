"""Exchange adapters and mocks.
This file provides a simple `ExchangeAdapter` base class and a `MockExchange` for local testing.
When ready to integrate with real exchanges, implement a subclass that uses `ccxt` or exchange SDKs.
"""
from typing import List, Tuple


class ExchangeAdapter:
    """Base class for exchange adapters.
    Implement `fetch_ohlcv` and `place_order` in subclasses.
    """

    def fetch_ohlcv(self, symbol: str, timeframe: str, limit: int):
        raise NotImplementedError()

    def place_order(self, symbol: str, side: str, amount: float, price: float = None):
        raise NotImplementedError()


class MockExchange(ExchangeAdapter):
    """Mock exchange that returns synthetic OHLCV data for testing/backtests.
    """

    def fetch_ohlcv(self, symbol: str, timeframe: str, limit: int):
        # Return list of (timestamp, open, high, low, close, volume)
        import numpy as np
        import pandas as pd
        now = pd.Timestamp.now()
        rng = pd.date_range(end=now, periods=limit, freq='T')
        prices = 100 + np.cumsum(np.random.randn(limit) * 0.2)
        ohlcv = []
        for t, p in zip(rng, prices):
            o = p + np.random.randn() * 0.05
            c = p
            h = max(o, c) + abs(np.random.randn() * 0.05)
            l = min(o, c) - abs(np.random.randn() * 0.05)
            v = float(abs(np.random.randn()) * 10)
            ohlcv.append((int(t.timestamp() * 1000), float(o), float(h), float(l), float(c), v))
        return ohlcv

    def place_order(self, symbol: str, side: str, amount: float, price: float = None):
        # Return a simple order dict
        return {"id": "mock-order-1", "symbol": symbol, "side": side, "amount": amount, "price": price}
