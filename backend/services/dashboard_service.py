"""Dashboard service supplying structured snapshot data."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

from backend.schemas.dashboard import DashboardSnapshot
from backend.schemas.shared import MarketPrice, Position, SystemStatus, Trade


class DashboardService:
    """Builds dashboard responses that mirror the frontend contract."""

    @staticmethod
    async def get_snapshot(
        include_prices: bool = True,
        include_positions: bool = True,
        include_trades: bool = True,
    ) -> DashboardSnapshot:
        """Return a dashboard snapshot populated with mock data."""

        now = datetime.utcnow()

        prices: List[MarketPrice] = (
            [
                MarketPrice(asset="BTC-USD", price=48_000.5, timestamp=now),
                MarketPrice(asset="ETH-USD", price=2_400.2, timestamp=now),
            ]
            if include_prices
            else []
        )

        positions: List[Position] = (
            [
                Position(
                    id="pos001",
                    asset="BTC-USD",
                    size=0.25,
                    entryPrice=46_000.0,
                    pnl=500.25,
                    updatedAt=now - timedelta(minutes=3),
                )
            ]
            if include_positions
            else []
        )

        trades: List[Trade] = (
            [
                Trade(
                    id="trade001",
                    asset="BTC-USD",
                    side="buy",
                    price=45_500.0,
                    size=0.15,
                    timestamp=now - timedelta(hours=1),
                )
            ]
            if include_trades
            else []
        )

        status = SystemStatus(health="healthy", latencyMs=42)
        total_pnl = sum(position.pnl for position in positions)
        portfolio_value = 125_000.75

        return DashboardSnapshot(
            prices=prices,
            positions=positions,
            trades=trades,
            status=status,
            portfolioValue=portfolio_value,
            totalPnl=total_pnl,
            generatedAt=now,
        )

    @staticmethod
    async def get_system_status() -> SystemStatus:
        """Return the current system status snapshot."""

        snapshot = await DashboardService.get_snapshot(
            include_prices=False,
            include_positions=False,
            include_trades=False,
        )
        return snapshot.status

    @staticmethod
    async def get_market_prices() -> List[MarketPrice]:
        """Return the current market price tiles."""

        snapshot = await DashboardService.get_snapshot(
            include_positions=False,
            include_trades=False,
        )
        return snapshot.prices

    @staticmethod
    async def get_positions() -> List[Position]:
        """Return open positions."""

        snapshot = await DashboardService.get_snapshot(
            include_prices=False,
            include_trades=False,
        )
        return snapshot.positions

    @staticmethod
    async def get_recent_trades() -> List[Trade]:
        """Return the recent trades list."""

        snapshot = await DashboardService.get_snapshot(
            include_prices=False,
            include_positions=False,
        )
        return snapshot.trades
