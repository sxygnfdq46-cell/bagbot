from worker.indicators.sma import SMA
from worker.indicators.ema import EMA
from worker.indicators.rsi import RSI
from worker.indicators.macd import MACD
from worker.indicators.atr import ATR


class IndicatorEngine:
    """
    Indicator engine providing safe access to all indicators.
    """

    def __init__(self):
        self.sma = SMA()
        self.ema = EMA()
        self.rsi = RSI()
        self.macd = MACD()
        self.atr = ATR()

    def get(self, name: str, data) -> dict:
        """
        Safely call indicator.calculate(data) and return result.

        Args:
            name: Indicator name (SMA, EMA, RSI, MACD, ATR)
            data: Data to pass to calculate method

        Returns:
            Dict with 'name' and 'value' keys
        """
        result = None
        try:
            if name == "SMA":
                result = self.sma.calculate(data) if isinstance(data, list) else None
            elif name == "EMA":
                result = self.ema.calculate(data) if isinstance(data, list) else None
            elif name == "RSI":
                result = self.rsi.calculate(data) if isinstance(data, list) else None
            elif name == "MACD":
                result = self.macd.calculate(data) if isinstance(data, list) else None
            elif name == "ATR":
                result = self.atr.calculate(data) if isinstance(data, list) else None
        except Exception:
            result = None

        return {"name": name, "value": result}
