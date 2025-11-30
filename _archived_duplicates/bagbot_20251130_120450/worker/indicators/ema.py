from typing import List, Optional
from bagbot.worker.indicators.base import BaseIndicator

class EMA(BaseIndicator):
    """
    Exponential Moving Average (EMA).
    """

    def calculate(self, prices: List[float], window: int = 20) -> Optional[float]:
        if not prices or len(prices) < window:
            return None
        # Seed EMA with simple SMA of first `window` values
        seed = sum(prices[-window:]) / float(window)
        k = 2.0 / (window + 1.0)
        # compute EMA over the last `window` values in a single pass
        ema = seed
        for price in prices[-window:]:
            ema = price * k + ema * (1 - k)
        return ema
