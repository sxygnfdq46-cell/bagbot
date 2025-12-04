"""Brain WebSocket channel streaming live neural telemetry."""
from __future__ import annotations

import asyncio
import contextlib
from typing import Any, List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from backend.schemas.auth import UserProfile
from backend.security.deps import get_current_user_ws
from backend.services.brain_service import (
    get_brain_activity,
    get_brain_logs,
    get_brain_metrics,
    get_brain_status,
)

router = APIRouter()

BROADCAST_INTERVAL_SECONDS = 2
HEARTBEAT_INTERVAL_SECONDS = 15


def _envelope(channel: str, data: Any) -> dict[str, Any]:
    return {"channel": channel, "data": data}


def _serialize_list(models: List[Any]) -> List[dict[str, Any]]:
    return [model.model_dump(mode="json") for model in models]


def _serialize_model(model: Any) -> dict[str, Any]:
    return model.model_dump(mode="json")


async def _broadcast_loop(websocket: WebSocket) -> None:
    while True:
        activity = await get_brain_activity()
        metrics = await get_brain_metrics()
        logs = await get_brain_logs()
        status = await get_brain_status()

        await websocket.send_json(_envelope("brain_activity", _serialize_list(activity)))
        await websocket.send_json(_envelope("brain_metrics", _serialize_model(metrics)))
        await websocket.send_json(_envelope("brain_logs", _serialize_list(logs)))
        await websocket.send_json(_envelope("brain_status", _serialize_model(status)))

        await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)


async def _heartbeat_loop(websocket: WebSocket) -> None:
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
        await websocket.send_json(_envelope("heartbeat", {"status": "ok"}))


@router.websocket("/brain")
async def brain_ws_endpoint(
    websocket: WebSocket,
    user: UserProfile = Depends(get_current_user_ws),
) -> None:
    """Stream brain telemetry to authenticated clients."""

    await websocket.accept()
    broadcast_task = asyncio.create_task(_broadcast_loop(websocket))
    heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket))

    try:
        await asyncio.gather(broadcast_task, heartbeat_task)
    except WebSocketDisconnect:
        pass
    finally:
        for task in (broadcast_task, heartbeat_task):
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        with contextlib.suppress(RuntimeError):
            await websocket.close()
