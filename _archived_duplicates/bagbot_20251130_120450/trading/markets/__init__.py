"""Multi-market trading support."""

from bagbot.trading.markets.market_adapter import MarketAdapter
from bagbot.trading.markets.parallel_router import ParallelMarketRouter

__all__ = ["MarketAdapter", "ParallelMarketRouter"]
