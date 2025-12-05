"""WebSocket broadcast stub for tests."""
from __future__ import annotations
from typing import Any, Dict, Optional, Union
from uuid import UUID


async def websocket_broadcast(
    channel: str,
    event: str,
    payload: Optional[Dict[str, Any]] = None,
    *,
    version: int = 1,
    bridge: Any | None = None,
    trace_id: Optional[Union[str, UUID]] = None,
    timestamp: Optional[str] = None,
) -> None:
    # Stub: in tests we do nothing
    return None


async def websocket_broadcast_legacy(
    channel: str,
    payload: Dict[str, Any],
    *,
    bridge: Any | None = None,
) -> None:
    await websocket_broadcast(channel=channel, event=payload.get("event", "legacy.event"), payload=payload, bridge=bridge)


__all__ = ["websocket_broadcast", "websocket_broadcast_legacy"]
