"""Simple backtester for demo purposes.
Runs a strategy on a synthetic price series and reports trades and PnL.
"""
from typing import Dict
import pandas as pd
import numpy as np
import logging
from .exchange import MockExchange
from .risk import RiskManager


class Backtester:
    def __init__(self, strategy, exchange=None, symbol: str = "BTC/USD", risk_manager: RiskManager = None, logger: logging.Logger = None, tp_pct: float = 0.05):
        self.strategy = strategy
        self.exchange = exchange or MockExchange()
        self.symbol = symbol
        self.risk_manager = risk_manager or RiskManager()
        self.logger = logger or logging.getLogger(__name__)
        # take-profit target as fraction above entry (default 5%)
        self.tp_pct = float(tp_pct)

    def _get_price_series(self, n=500):
        # Use exchange mock to get OHLCV and convert to close series
        ohlcv = self.exchange.fetch_ohlcv(self.symbol, timeframe="1m", limit=n)
        df = pd.DataFrame(ohlcv, columns=["ts", "o", "h", "l", "c", "v"])
        df["ts"] = pd.to_datetime(df["ts"], unit="ms")
        df = df.set_index("ts")
        return df["c"]

    def run(self) -> Dict:
        prices = self._get_price_series()
        signals = self.strategy.on_price_series(prices)

        # map signals by timestamp -> list of actions
        sig_map = {}
        for ts, action, amt in signals:
            sig_map.setdefault(ts, []).append((action, amt))

        cash = 10000.0
        position = 0.0
        trades = []

        # trailing-stop state
        entry_price = None
        tp_price = None
        stop_price = None
        stop_moved_to_30 = False
        stop_moved_to_70 = False

        for ts, price in prices.items():
            price = float(price)
            equity = cash + position * price

            # handle any strategy signals at this timestamp first
            if ts in sig_map:
                for action, _amt in sig_map[ts]:
                    if action == "buy":
                        # size by risk manager
                        size = self.risk_manager.position_size_by_risk(equity, price)
                        max_affordable = cash / price if price > 0 else 0.0
                        size = min(size, max_affordable)
                        if size <= 0:
                            self.logger.debug("Calculated buy size is 0 (ts=%s), skipping", ts)
                            continue
                        cash -= price * size
                        position += size
                        entry_price = price
                        tp_price = entry_price * (1.0 + self.tp_pct)
                        # initial stop based on risk_manager.stop_loss_pct below entry
                        stop_price = entry_price * (1.0 - self.risk_manager.stop_loss_pct)
                        stop_moved_to_30 = False
                        stop_moved_to_70 = False
                        trades.append({"ts": ts, "side": "buy", "price": price, "amount": size})
                        self.logger.info("BUY %s @ %.4f size=%.6f entry=%.4f tp=%.4f stop=%.4f equity=%.2f", self.symbol, price, size, entry_price, tp_price, stop_price, equity)

                    elif action == "sell":
                        if position <= 0:
                            self.logger.debug("No position to sell at ts=%s", ts)
                            continue
                        size = position
                        cash += price * size
                        trades.append({"ts": ts, "side": "sell", "price": price, "amount": size})
                        self.logger.info("SELL (signal) %s @ %.4f size=%.6f equity=%.2f", self.symbol, price, size, equity)
                        position = 0.0
                        entry_price = None
                        tp_price = None
                        stop_price = None

            # if we have a position, update trailing stop based on progress toward TP
            if position > 0 and entry_price is not None and tp_price is not None:
                # avoid division by zero
                denom = tp_price - entry_price
                progress = 0.0
                if denom > 0:
                    progress = (price - entry_price) / denom

                # when progress >=60% move stop to 30% into TP
                if progress >= 0.6 and not stop_moved_to_30:
                    new_stop = entry_price + 0.3 * (tp_price - entry_price)
                    if new_stop > stop_price:
                        stop_price = new_stop
                    stop_moved_to_30 = True
                    self.logger.info("Trailing stop moved to 30%% into TP -> stop=%.4f (progress=%.2f)", stop_price, progress)

                # when progress >=90% move stop to 70% into TP
                if progress >= 0.9 and not stop_moved_to_70:
                    new_stop = entry_price + 0.7 * (tp_price - entry_price)
                    if new_stop > stop_price:
                        stop_price = new_stop
                    stop_moved_to_70 = True
                    self.logger.info("Trailing stop moved to 70%% into TP -> stop=%.4f (progress=%.2f)", stop_price, progress)

                # check stop hit
                if stop_price is not None and price <= stop_price:
                    # execute stop sell
                    size = position
                    cash += price * size
                    trades.append({"ts": ts, "side": "sell", "price": price, "amount": size, "reason": "trailing_stop"})
                    self.logger.info("STOP-LOSS TRIGGERED %s @ %.4f size=%.6f stop=%.4f", self.symbol, price, size, stop_price)
                    position = 0.0
                    entry_price = None
                    tp_price = None
                    stop_price = None

        # mark-to-market
        final_price = float(prices.iloc[-1])
        pnl = cash + position * final_price - 10000.0
        self.logger.info("Backtest finished final_cash=%.2f position=%.6f final_price=%.4f pnl=%.2f", cash, position, final_price, pnl)
        return {"final_cash": cash, "position": position, "final_price": final_price, "pnl": pnl, "trades": trades}
