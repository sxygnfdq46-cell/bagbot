"""WebSocket broadcast stubs for tests."""
from __future__ import annotations

import asyncio
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
) -> Dict[str, Any] | None:
    return {
        "channel": channel,
        "event": event,
        "payload": payload or {},
        "version": version,
        "trace_id": trace_id,
        "timestamp": timestamp,
    }


async def websocket_broadcast_legacy(
    channel: str,
    payload: Dict[str, Any],
    *,
    bridge: Any | None = None,
) -> Dict[str, Any] | None:
    return await websocket_broadcast(
        channel=channel,
        event=payload.get("event", "legacy.event"),
        payload=payload,
        bridge=bridge,
    )


async def _broadcast_strategy_state_async(
    strategy_id: str,
    state: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any] | None:
    body = {"strategy_id": strategy_id, "state": state}
    if payload:
        body.update(payload)
    event = f"strategy.{state}"
    return await websocket_broadcast(
        channel="signals",
        event=event,
        payload=body,
    )


def broadcast_strategy_state(
    strategy_id: str,
    state: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any] | None:
    return asyncio.run(
        _broadcast_strategy_state_async(strategy_id, state, payload)
    )


__all__ = [
    "websocket_broadcast",
    "websocket_broadcast_legacy",
    "broadcast_strategy_state",
]
