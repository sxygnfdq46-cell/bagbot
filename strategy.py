"""Strategy definitions.
Includes a small MovingAverageCrossStrategy used by the demo backtester.
"""
from typing import List
import pandas as pd


class Strategy:
    """Base strategy interface."""

    def on_price_series(self, prices: pd.Series):
        """Receive price series (index -> timestamp) and return list of signals.
        Signals are tuples: (timestamp, action, amount)
        action: 'buy' or 'sell'
        """
        raise NotImplementedError()


class MovingAverageCrossStrategy(Strategy):
    def __init__(self, short_window: int = 5, long_window: int = 20):
        self.short = short_window
        self.long = long_window

    def on_price_series(self, prices: pd.Series):
        df = pd.DataFrame({"close": prices})
        df["ma_short"] = df["close"].rolling(self.short).mean()
        df["ma_long"] = df["close"].rolling(self.long).mean()
        df = df.dropna()
        signals = []
        position = 0
        for ts, row in df.iterrows():
            if row["ma_short"] > row["ma_long"] and position == 0:
                signals.append((ts, "buy", 1.0))
                position = 1
            elif row["ma_short"] < row["ma_long"] and position == 1:
                signals.append((ts, "sell", 1.0))
                position = 0
        return signals
