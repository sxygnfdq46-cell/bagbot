from typing import List, Optional
from worker.indicators.base import BaseIndicator

class SMA(BaseIndicator):
    """
    Simple Moving Average (SMA).
    """

    def calculate(self, prices: List[float], window: int = 20) -> Optional[float]:
        # Return None if insufficient data
        if not prices or len(prices) < window:
            return None
        # use most recent 'window' values (last elements)
        window_vals = prices[-window:]
        return sum(window_vals) / float(window)
