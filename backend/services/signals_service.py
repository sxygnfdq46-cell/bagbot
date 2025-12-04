"""Signals service supplying mock signal telemetry for WebSocket streams."""
from __future__ import annotations

import random
from collections import deque
from datetime import datetime, timedelta
from typing import Deque, Dict, List

from backend.schemas.signals import (
    SignalLogEntry,
    SignalProviderStatus,
    SignalRecord,
    SignalsStatusSummary,
)


class SignalsService:
    """Generates rolling mock data for the signals experience."""

    _PROVIDERS = [
        "Helios Alpha",
        "Astra Prime",
        "Nova Edge",
        "Sentinel Grid",
    ]
    _ASSETS = ["BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD", "MATIC-USD"]
    _TIMEFRAMES = ["1m", "5m", "15m", "1h"]
    _DIRECTIONS = ["long", "short", "neutral"]
    _LOG_LEVELS = ["info", "warning", "error"]

    _FEED_MAX = 40
    _LOG_MAX = 50

    _feed_buffer: Deque[SignalRecord] = deque(maxlen=_FEED_MAX)
    _log_buffer: Deque[SignalLogEntry] = deque(maxlen=_LOG_MAX)
    _provider_statuses: Dict[str, SignalProviderStatus] = {}

    @classmethod
    def _bootstrap(cls) -> None:
        if cls._feed_buffer:
            return

        now = datetime.utcnow()
        for index in range(8):
            cls._feed_buffer.appendleft(cls._build_signal(now - timedelta(seconds=index * 9)))

        for provider in cls._PROVIDERS:
            cls._provider_statuses[provider] = SignalProviderStatus(
                provider=provider,
                connected=True,
                latencyMs=round(random.uniform(20, 60)),
                lastSignalAt=now,
            )

        cls._append_log("info", "Signals telemetry pipeline initialized", provider="system")

    @classmethod
    def _build_signal(cls, timestamp: datetime | None = None) -> SignalRecord:
        asset = random.choice(cls._ASSETS)
        direction = random.choice(cls._DIRECTIONS)
        price = round(random.uniform(800, 80_000), 2)
        confidence = round(random.uniform(40, 98), 1)
        timeframe = random.choice(cls._TIMEFRAMES)
        generated_at = timestamp or datetime.utcnow()
        provider = random.choice(cls._PROVIDERS)

        cls._update_provider_activity(provider, generated_at)

        return SignalRecord(
            id=f"signal-{generated_at.timestamp():.0f}-{random.randint(100, 999)}",
            provider=provider,
            asset=asset,
            direction=direction,  # type: ignore[arg-type]
            confidence=confidence,
            price=price,
            timeframe=timeframe,
            generatedAt=generated_at,
        )

    @classmethod
    def _append_log(cls, level: str, message: str, provider: str) -> None:
        cls._log_buffer.appendleft(
            SignalLogEntry(
                id=f"log-{datetime.utcnow().timestamp():.0f}-{random.randint(100, 999)}",
                provider=provider,
                level=level,  # type: ignore[arg-type]
                message=message,
                timestamp=datetime.utcnow(),
            )
        )

    @classmethod
    def _update_provider_activity(cls, provider: str, timestamp: datetime) -> None:
        status = cls._provider_statuses.get(provider)
        if not status:
            status = SignalProviderStatus(provider=provider, connected=True, latencyMs=50, lastSignalAt=timestamp)
        else:
            status = status.copy(update={"lastSignalAt": timestamp, "latencyMs": max(15, status.latencyMs + random.randint(-5, 5))})
        cls._provider_statuses[provider] = status

    @classmethod
    def _mutate_feed(cls) -> None:
        if random.random() > 0.35 and cls._feed_buffer:
            mutated = []
            for record in list(cls._feed_buffer)[:5]:
                drift = random.uniform(-5, 5)
                mutated.append(
                    record.copy(
                        update={
                            "confidence": round(max(20, min(99, record.confidence + drift)), 1),
                            "generatedAt": datetime.utcnow(),
                        }
                    )
                )
            for updated in mutated:
                cls._feed_buffer.appendleft(updated)
        else:
            cls._feed_buffer.appendleft(cls._build_signal())

        while len(cls._feed_buffer) > cls._FEED_MAX:
            cls._feed_buffer.pop()

    @classmethod
    def _mutate_providers(cls) -> None:
        for provider, status in list(cls._provider_statuses.items()):
            connected = status.connected if random.random() > 0.1 else not status.connected
            latency = max(10, min(250, status.latencyMs + random.randint(-8, 12)))
            cls._provider_statuses[provider] = status.copy(update={"connected": connected, "latencyMs": latency})

    @classmethod
    def _mutate_logs(cls) -> None:
        if random.random() > 0.4:
            provider = random.choice(cls._PROVIDERS)
            cls._append_log(
                random.choice(cls._LOG_LEVELS),
                random.choice(
                    [
                        "Signal threshold crossed",
                        "Provider latency spike detected",
                        "Confidence normalized",
                        "Risk guard activated",
                    ]
                ),
                provider=provider,
            )

    @classmethod
    async def get_feed(cls) -> List[SignalRecord]:
        """Return the rolling signals feed."""

        cls._bootstrap()
        cls._mutate_feed()
        return list(cls._feed_buffer)

    @classmethod
    async def get_status(cls) -> SignalsStatusSummary:
        """Return aggregated provider health information."""

        cls._bootstrap()
        cls._mutate_providers()

        providers = list(cls._provider_statuses.values())
        connected = sum(1 for provider in providers if provider.connected)

        if connected == len(providers):
            health = "healthy"
        elif connected == 0:
            health = "offline"
        else:
            health = "degraded"

        return SignalsStatusSummary(
            providers=providers,
            totalActiveProviders=connected,
            overallHealth=health,  # type: ignore[arg-type]
            updatedAt=datetime.utcnow(),
        )

    @classmethod
    async def get_logs(cls) -> List[SignalLogEntry]:
        """Return the most recent signal pipeline logs."""

        cls._bootstrap()
        cls._mutate_logs()
        return list(cls._log_buffer)

    @classmethod
    async def get_recent(cls, limit: int = 6) -> List[SignalRecord]:
        """Return a small subset of the latest signals for sidebar widgets."""

        feed = await cls.get_feed()
        return feed[:limit]

