from typing import List, Optional
from bagbot.worker.indicators.base import BaseIndicator

class RSI(BaseIndicator):
    """
    Relative Strength Index (RSI) using Wilder smoothing.
    """

    def calculate(self, prices: List[float], period: int = 14) -> Optional[float]:
        if not prices or len(prices) < period + 1:
            return None
        # compute deltas for the last `period` intervals
        gains = 0.0
        losses = 0.0
        # use the last (period) changes: prices[-(period+1):] to compute deltas
        window = prices[-(period + 1):]
        deltas = []
        for i in range(1, len(window)):
            diff = window[i] - window[i - 1]
            deltas.append(diff)
            if diff > 0:
                gains += diff
            else:
                losses += abs(diff)
        # initial average gain/loss
        avg_gain = gains / period
        avg_loss = losses / period
        # if avg_loss == 0 then RSI is 100 (avoid division by zero)
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        rsi = 100.0 - (100.0 / (1.0 + rs))
        return rsi
