"""Dashboard WebSocket channel with JWT auth and broadcast loops."""
from __future__ import annotations

import asyncio
import contextlib
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.schemas.auth import UserProfile
from backend.security.jwt import TokenError, validate_token
from backend.services.dashboard_service import DashboardService

router = APIRouter()

BROADCAST_INTERVAL_SECONDS = 2
HEARTBEAT_INTERVAL_SECONDS = 15
UNAUTHORIZED_CLOSE_CODE = 4401


def _extract_token(websocket: WebSocket) -> Optional[str]:
    """Read a bearer token from query params or headers."""

    token_param = websocket.query_params.get("token")
    if token_param:
        return token_param

    auth_header = websocket.headers.get("Authorization")
    if auth_header:
        scheme, _, value = auth_header.partition(" ")
        if scheme.lower() == "bearer" and value:
            return value

    return None


def _channel_payload(channel: str, data: Any) -> Dict[str, Any]:
    return {"channel": channel, "data": data}


def _serialize_list(models: List[Any]) -> List[Dict[str, Any]]:
    return [model.model_dump(mode="json") for model in models]


def _serialize_model(model: Any) -> Dict[str, Any]:
    return model.model_dump(mode="json")


def _validate_user(websocket: WebSocket) -> UserProfile:
    token = _extract_token(websocket)
    if not token:
        raise TokenError("Missing token")

    payload = validate_token(token)
    user_data = payload.get("user")
    if not user_data:
        raise TokenError("Invalid token payload")

    return UserProfile(**user_data)


async def _broadcast_loop(websocket: WebSocket) -> None:
    while True:
        system_status = await DashboardService.get_system_status()
        market_prices = await DashboardService.get_market_prices()
        positions = await DashboardService.get_positions()
        trades = await DashboardService.get_recent_trades()

        await websocket.send_json(
            _channel_payload("system_status", _serialize_model(system_status))
        )
        await websocket.send_json(
            _channel_payload("market_prices", _serialize_list(market_prices))
        )
        await websocket.send_json(
            _channel_payload("positions", _serialize_list(positions))
        )
        await websocket.send_json(
            _channel_payload("trades", _serialize_list(trades))
        )

        await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)


async def _heartbeat_loop(websocket: WebSocket) -> None:
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
        await websocket.send_json({"type": "heartbeat"})


@router.websocket("/dashboard")
async def dashboard_stream(websocket: WebSocket) -> None:
    """Authenticated dashboard WebSocket endpoint."""

    try:
        _user = _validate_user(websocket)
    except TokenError as exc:
        await websocket.close(code=UNAUTHORIZED_CLOSE_CODE, reason=str(exc))
        return

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
