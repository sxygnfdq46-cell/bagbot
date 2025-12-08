from typing import List, Optional, Dict
from worker.indicators.ema import EMA

class MACD:
    """
    MACD indicator using two EMAs and a signal EMA.
    """

    def calculate(self, prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Optional[Dict[str, float]]:
        # need at least `slow + signal` data points for stable values
        min_len = slow + signal
        if not prices or len(prices) < min_len:
            return None
        # compute fast EMA and slow EMA over the available window
        ema_fast = EMA().calculate(prices, window=fast)
        ema_slow = EMA().calculate(prices, window=slow)
        if ema_fast is None or ema_slow is None:
            return None
        macd_line = ema_fast - ema_slow
        # For signal line, treat the MACD series as a single-value list repeated for smoothing:
        # compute a simple EMA of MACD over `signal` period using the last `signal` macd-like values.
        # For simplicity and safety, compute signal by computing EMA on last (slow + signal) differences:
        # Build a pseudo-series of MACD values by computing EMA(fast) - EMA(slow) for rolling windows.
        macd_series = []
        for i in range(len(prices) - slow + 1, len(prices) + 1):
            slice_prices = prices[:i]
            ef = EMA().calculate(slice_prices, window=fast)
            es = EMA().calculate(slice_prices, window=slow)
            if ef is None or es is None:
                continue
            macd_series.append(ef - es)
        if len(macd_series) < signal:
            return None
        # compute signal as EMA of macd_series using simple EMA formula on last `signal` values
        # seed with simple average
        seed = sum(macd_series[-signal:]) / float(signal)
        k = 2.0 / (signal + 1.0)
        sig = seed
        for val in macd_series[-signal:]:
            sig = val * k + sig * (1 - k)
        histogram = macd_line - sig
        return {"macd": macd_line, "signal": sig, "histogram": histogram}
