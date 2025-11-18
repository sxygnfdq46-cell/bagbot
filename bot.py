"""TradingBot wiring: connects strategy and exchange adapter for live/paper runs.
This file is small because live execution requires exchange SDKs, streaming data, order management, and risk controls which are out-of-scope for the minimal scaffold.
"""
from typing import Optional
from .exchange import ExchangeAdapter
from .strategy import Strategy
from .risk import RiskManager
import logging


class TradingBot:
    def __init__(self, strategy: Strategy, exchange: Optional[ExchangeAdapter] = None, risk_manager: RiskManager = None, logger: logging.Logger = None):
        self.strategy = strategy
        self.exchange = exchange
        self.risk_manager = risk_manager or RiskManager()
        self.logger = logger or logging.getLogger(__name__)

    def run_once(self):
        # Example: fetch recent prices and forward to strategy for a decision
        if self.exchange is None:
            raise RuntimeError("No exchange configured")
        ohlcv = self.exchange.fetch_ohlcv("BTC/USD", timeframe="1m", limit=200)
        # Convert to pandas series lazily
        import pandas as pd
        df = pd.DataFrame(ohlcv, columns=["ts", "o", "h", "l", "c", "v"]) 
        df["ts"] = pd.to_datetime(df["ts"], unit="ms")
        df = df.set_index("ts")
        prices = df["c"]
        signals = self.strategy.on_price_series(prices)

        # Execute signals using risk sizing and the exchange adapter
        executed = []
        # naive account state for sizing demo
        cash = 10000.0
        position = 0.0
        for ts, action, _ in signals:
            try:
                price = float(prices.loc[ts])
            except Exception:
                self.logger.debug("No price for signal ts=%s", ts)
                continue
            equity = cash + position * price
            if action == "buy":
                size = self.risk_manager.position_size_by_risk(equity, price)
                max_affordable = cash / price if price > 0 else 0.0
                size = min(size, max_affordable)
                if size <= 0:
                    self.logger.debug("Calculated buy size 0, skipping")
                    continue
                order = self.exchange.place_order("BTC/USD", "buy", size, price=price)
                cash -= price * size
                position += size
                executed.append(order)
                self.logger.info("Placed order: %s", order)
            elif action == "sell":
                size = position
                if size <= 0:
                    continue
                order = self.exchange.place_order("BTC/USD", "sell", size, price=price)
                cash += price * size
                position -= size
                executed.append(order)
                self.logger.info("Placed order: %s", order)

        return executed
