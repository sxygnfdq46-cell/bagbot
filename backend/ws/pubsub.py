"""Pub/Sub helpers for WebSocket broadcasts."""
from __future__ import annotations

from typing import Any, AsyncIterator


class PubSubBridge:
    """Skeleton bridge for Redis or other pub/sub providers."""

    async def subscribe(self, channel: str) -> AsyncIterator[dict[str, Any]]:
        """TODO: yield messages for the requested channel."""
        raise NotImplementedError("Pub/Sub bridge not implemented")

    async def publish(self, channel: str, payload: dict[str, Any]) -> None:
        """TODO: publish messages for downstream consumers."""
        raise NotImplementedError("Pub/Sub bridge not implemented")
