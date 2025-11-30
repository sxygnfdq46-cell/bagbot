# worker/strategies/ai_fusion.py
"""
Full Hybrid AI Fusion Strategy - deterministic indicator-based decision system.
Pure Python only. No new dependencies or network calls.
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from bagbot.worker.strategies.base import StrategyBase
from bagbot.worker.indicators.sma import SMA
from bagbot.worker.indicators.ema import EMA
from bagbot.worker.indicators.rsi import RSI
from bagbot.worker.indicators.macd import MACD
from bagbot.worker.indicators.atr import ATR


@dataclass
class AIFusionConfig:
    # Optimized parameters from genetic algorithm (Sharpe ratio: 2.58)
    sma_short: int = 10
    sma_long: int = 49
    ema_short: int = 7
    ema_long: int = 47
    rsi_period: int = 24
    macd_fast: int = 10
    macd_slow: int = 18
    macd_signal: int = 8
    atr_period: int = 16
    risk_per_trade_pct: float = 0.0025      # 0.25% per trade (optimized)
    max_position_pct: float = 0.0103        # 1.03% max position (optimized)
    
    # --- NEW PARAMETERS ---
    trailing_stop_enabled: bool = True
    trailing_atr_multiplier: float = 2.34   # optimized trailing stop distance
    volatility_filter_enabled: bool = True
    volatility_atr_threshold: float = 0.429 # optimized volatility threshold
    min_position_size: float = 0.001        # minimum instrument size (in lots/tokens)


class AIFusionStrategy(StrategyBase):
    """
    Full Hybrid AI Fusion Strategy using indicators: SMA, EMA, RSI, MACD, ATR.
    Deterministic and unit-test friendly.
    Important: indicators are per-symbol in real systems, but for this exercise reuse instances
    and always pass symbol price payloads as the tests do.
    """

    def __init__(self, config: Optional[AIFusionConfig] = None):
        self.cfg = config or AIFusionConfig()
        # Indicator instances keep state per symbol
        self.sma_short = SMA()
        self.sma_long = SMA()
        self.ema_short = EMA()
        self.ema_long = EMA()
        self.rsi = RSI()
        self.macd = MACD()
        self.atr = ATR()
        # Keep candle history per symbol (for indicators that need OHLC data)
        self.candle_history: Dict[str, list] = {}
        self.last_trailing = {}  # store trailing stop per symbol (symbol -> float)

    def compute_indicators(self, payload: dict) -> dict:
        """
        Push the price into indicators and return latest values.
        payload is the raw job payload (e.g. {"symbol": "BTCUSDT", "price": 50000})
        or a candle dict (e.g. {"timestamp": ..., "close": 50000, ...}).
        """
        # Handle both price and candle formats
        if "price" in payload:
            price = float(payload["price"])
            # Create a simple candle for ATR
            candle = {"high": price, "low": price, "close": price}
        elif "close" in payload:
            price = float(payload["close"])
            # Use actual candle data
            candle = {
                "high": float(payload.get("high", price)),
                "low": float(payload.get("low", price)),
                "close": price
            }
        else:
            return {}
        
        symbol = payload.get("symbol", "DEFAULT")
        
        # Update candle history
        if symbol not in self.candle_history:
            self.candle_history[symbol] = []
        self.candle_history[symbol].append(candle)
        # Keep reasonable history (e.g., last 100 candles)
        if len(self.candle_history[symbol]) > 100:
            self.candle_history[symbol] = self.candle_history[symbol][-100:]
        
        candles = self.candle_history[symbol]
        prices = [c["close"] for c in candles]
        
        # Feed indicators - .calculate() can return None if insufficient data
        sma_s = self.sma_short.calculate(prices, window=self.cfg.sma_short)
        sma_l = self.sma_long.calculate(prices, window=self.cfg.sma_long)
        ema_s = self.ema_short.calculate(prices, window=self.cfg.ema_short)
        ema_l = self.ema_long.calculate(prices, window=self.cfg.ema_long)
        rsi_v = self.rsi.calculate(prices, period=self.cfg.rsi_period)
        macd_v = self.macd.calculate(prices, fast=self.cfg.macd_fast, slow=self.cfg.macd_slow, signal=self.cfg.macd_signal)  # expect dict {macd, signal, hist} or number
        
        # ATR needs candles with high/low/close
        atr_v = self.atr.calculate(candles, period=self.cfg.atr_period)
        
        # If indicator .update() returns None due to insufficient history, propagate None values
        return {
            "sma_short": sma_s,
            "sma_long": sma_l,
            "ema_short": ema_s,
            "ema_long": ema_l,
            "rsi": rsi_v,
            "macd": macd_v,
            "atr": atr_v,
        }

    def _volatility_ok(self, atr: Optional[float]) -> bool:
        """Return True if volatility is acceptable (not above threshold)."""
        if not self.cfg.volatility_filter_enabled:
            return True
        if atr is None:
            return False
        # ATR is in price units; if ATR > threshold we treat market as too volatile
        return atr <= self.cfg.volatility_atr_threshold

    def _compute_position_size(self, equity: float, price: float, atr: float) -> float:
        """
        ATR-based sizing:
            risk_per_trade = equity * risk_per_trade_pct
            dollar_atr = atr
            size_by_risk = risk_per_trade / (atr * stop_multiplier)  # stop distance implied
            size_by_max = equity * max_position_pct / price
        Return float size (instrument units). Respect min_position_size.
        """
        risk_amount = equity * self.cfg.risk_per_trade_pct
        # use ATR to scale; assume stop is trailing_atr_multiplier * ATR away
        stop_distance = max(1e-12, self.cfg.trailing_atr_multiplier * atr)
        size_by_risk = risk_amount / stop_distance if stop_distance > 0 else 0.0
        size_by_max = (equity * self.cfg.max_position_pct) / max(1e-12, price)
        size = min(size_by_risk, size_by_max)
        # enforce minimum
        if size < self.cfg.min_position_size:
            return 0.0
        return float(size)

    def _attach_stop_take(self, side: str, price: float, atr: float) -> Dict[str, float]:
        """
        Compute stop_loss and take_profit based on ATR.
        BUY: stop = price - 2*ATR, take = price + 3*ATR
        SELL: stop = price + 2*ATR, take = price - 3*ATR
        """
        if atr is None:
            return {}
        stop_dist = 2.0 * atr
        tp_dist = 3.0 * atr
        if side.lower() == "buy":
            return {"stop_loss": price - stop_dist, "take_profit": price + tp_dist}
        else:
            return {"stop_loss": price + stop_dist, "take_profit": price - tp_dist}

    def _prepare_order(self, symbol: str, side: str, size: float, price: float, atr: float) -> dict:
        """
        Prepare an order dict that fits the project EXECUTE_ORDER format.
        We attach stop/take and optionally a 'trailing' flag.
        """
        order = {
            "symbol": symbol,
            "side": side.upper(),
            "size": size,
            "price": price,
        }
        # attach deterministic stop/tp
        st_tp = self._attach_stop_take(side, price, atr)
        order.update(st_tp)
        # trailing stop meta (executor/backtest can read and use it)
        if self.cfg.trailing_stop_enabled:
            order["trailing"] = {
                "enabled": True,
                "atr_multiplier": float(self.cfg.trailing_atr_multiplier),
                "initial_stop": st_tp.get("stop_loss"),
            }
        return order

    def fuse_decision(self, payload: dict, indicators: dict) -> Optional[dict]:
        """
        Returns the decision dict or None.
        Rules to implement exactly:
        
        Trend confirmation:
        - trend_up = ema_short > ema_long (if either is None → trend_up = False)
        - trend_down = ema_short < ema_long
        
        Momentum & entry:
        - momentum_buy = (sma_short is not None and sma_long is not None and sma_short > sma_long)
        - momentum_sell = (sma_short is not None and sma_long is not None and sma_short < sma_long)
        
        Oscillator safety (RSI):
        - allow buy only if rsi is not None and rsi > 30 and rsi < 75
        - allow sell only if rsi is not None and rsi < 70 and rsi > 25
        
        MACD confirmation:
        - consider macd histogram hist = macd.get("hist") if isinstance(macd, dict)
        - require hist > 0 for buy, hist < 0 for sell (if hist None, skip confirmation)
        
        Final buy condition:
        - trend_up and momentum_buy and macd_hist>0 and rsi in allowed range
        
        Final sell condition:
        - trend_down and momentum_sell and macd_hist<0 and rsi in allowed range
        
        If both buy and sell evaluated false or indicators insufficient, return None.
        """
        # Extract indicator values
        ema_s = indicators.get("ema_short")
        ema_l = indicators.get("ema_long")
        sma_s = indicators.get("sma_short")
        sma_l = indicators.get("sma_long")
        rsi = indicators.get("rsi")
        macd = indicators.get("macd")
        atr = indicators.get("atr")

        # Trend confirmation
        if ema_s is None or ema_l is None:
            trend_up = False
            trend_down = False
        else:
            trend_up = ema_s > ema_l
            trend_down = ema_s < ema_l

        # Momentum & entry
        momentum_buy = (sma_s is not None and sma_l is not None and sma_s > sma_l)
        momentum_sell = (sma_s is not None and sma_l is not None and sma_s < sma_l)

        # Oscillator safety (RSI)
        rsi_buy_allowed = (rsi is not None and rsi > 30 and rsi < 75)
        rsi_sell_allowed = (rsi is not None and rsi < 70 and rsi > 25)

        # MACD confirmation
        macd_hist = None
        if isinstance(macd, dict):
            macd_hist = macd.get("hist") or macd.get("histogram")
        # require hist > 0 for buy, hist < 0 for sell (if hist None, skip confirmation)
        macd_buy_ok = (macd_hist is not None and macd_hist > 0)
        macd_sell_ok = (macd_hist is not None and macd_hist < 0)

        # Final buy condition
        buy_signal = trend_up and momentum_buy and macd_buy_ok and rsi_buy_allowed

        # Final sell condition
        sell_signal = trend_down and momentum_sell and macd_sell_ok and rsi_sell_allowed

        # Volatility filter
        if not self._volatility_ok(atr):
            return None
        
        # If both evaluated false or indicators insufficient, return None
        if not buy_signal and not sell_signal:
            return None

        # Position sizing and stops (deterministic and safe)
        # Handle both price and candle formats
        if "price" in payload:
            price = float(payload["price"])
        elif "close" in payload:
            price = float(payload["close"])
        else:
            return None

        # Compute atr = indicators["atr"] (if None → use fallback price * 0.01)
        if atr is None:
            atr = price * 0.01

        # Assume account and equity are available via self.account if present — do not import
        # executor.account, instead read getattr(self, "account", None); if not present,
        # assume equity = 10000.0
        equity = getattr(self, "account", None)
        if equity is not None and hasattr(equity, "balance"):
            eq = float(equity.balance)
        else:
            eq = 10000.0

        # Use new position sizing method
        size = self._compute_position_size(eq, price, atr or 0.0)

        # Determine side
        if buy_signal:
            side = "BUY"
        else:
            side = "SELL"
        
        # Check minimum size
        if size <= 0 or size < self.cfg.min_position_size:
            return None
        
        # Prepare order with stops and trailing
        symbol = payload.get("symbol", "BTCSTUSDT")
        order = self._prepare_order(symbol, side, size, price, atr or 0.0)
        return {"type": "EXECUTE_ORDER", "order": order}

    def on_price_update(self, payload: dict) -> Optional[dict]:
        """
        Compute indicators, fuse decision, return decision dict or None.
        """
        # compute indicators
        indicators = self.compute_indicators(payload)
        # fuse decision
        decision = self.fuse_decision(payload, indicators)
        return decision

    def on_signal_check(self, payload: dict) -> Optional[dict]:
        """For now, same logic as price update."""
        return self.on_price_update(payload)
