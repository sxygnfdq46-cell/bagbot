"""WebSocket router wiring for all live channels."""
from fastapi import APIRouter, WebSocket

from backend.ws.admin_stream import handle_admin_logs
from backend.ws.bot_stream import handle_bot_logs, handle_bot_telemetry
from backend.ws.brain_stream import handle_brain_events
from backend.ws.charts_stream import handle_charts_stream

router = APIRouter()


@router.websocket("/ws/charts")
async def charts_ws(websocket: WebSocket) -> None:
    """Proxy to charts stream handler (placeholder)."""
    await handle_charts_stream(websocket)


@router.websocket("/ws/bot/telemetry")
async def bot_telemetry_ws(websocket: WebSocket) -> None:
    """Proxy to bot telemetry stream (placeholder)."""
    await handle_bot_telemetry(websocket)


@router.websocket("/ws/bot/logs")
async def bot_logs_ws(websocket: WebSocket) -> None:
    """Proxy to bot log stream (placeholder)."""
    await handle_bot_logs(websocket)


@router.websocket("/ws/brain/events")
async def brain_events_ws(websocket: WebSocket) -> None:
    """Proxy to brain event stream (placeholder)."""
    await handle_brain_events(websocket)



@router.websocket("/ws/admin/logs")
async def admin_logs_ws(websocket: WebSocket) -> None:
    """Proxy to admin log stream (placeholder)."""
    await handle_admin_logs(websocket)
