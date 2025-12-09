"""Brain WebSocket channel streaming live neural telemetry."""
from __future__ import annotations

import asyncio
import contextlib
from typing import Any, List
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from backend.schemas.auth import UserProfile
from backend.security.deps import get_current_user_ws
from backend.services.brain_service import (
    get_brain_activity,
    get_brain_logs,
    get_brain_metrics,
    get_brain_status,
)
from backend.utils.logging import log_event
from backend.utils.metrics import MetricsClient

router = APIRouter()
logger = logging.getLogger(__name__)

_metrics: MetricsClient | None = None


def set_metrics_client(client: MetricsClient) -> None:
    global _metrics
    _metrics = client

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


def _on_connect(websocket: WebSocket) -> None:
    request_id = websocket.headers.get("X-Request-ID")
    log_event(
        logger,
        "ws.brain.connect",
        request_id=request_id,
        route="/ws/brain",
        action="ws.connect",
    )
    if _metrics:
        try:
            _metrics.inc_gauge("ws_connections_active")
        except Exception:
            logger.debug("ws gauge inc failed", exc_info=True)


def _on_disconnect(websocket: WebSocket) -> None:
    request_id = websocket.headers.get("X-Request-ID")
    log_event(
        logger,
        "ws.brain.disconnect",
        request_id=request_id,
        route="/ws/brain",
        action="ws.disconnect",
    )
    if _metrics:
        try:
            _metrics.dec_gauge("ws_connections_active")
            _metrics.inc_counter("ws_disconnects_total")
        except Exception:
            logger.debug("ws gauge dec failed", exc_info=True)


@router.websocket("/brain")
async def brain_ws_endpoint(
    websocket: WebSocket,
    user: UserProfile = Depends(get_current_user_ws),
) -> None:
    """Stream brain telemetry to authenticated clients."""

    await websocket.accept()
    _on_connect(websocket)
    broadcast_task = asyncio.create_task(_broadcast_loop(websocket))
    heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket))

    try:
        await asyncio.gather(broadcast_task, heartbeat_task)
    except WebSocketDisconnect:
        pass
    finally:
        _on_disconnect(websocket)
        for task in (broadcast_task, heartbeat_task):
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        with contextlib.suppress(RuntimeError):
            await websocket.close()
