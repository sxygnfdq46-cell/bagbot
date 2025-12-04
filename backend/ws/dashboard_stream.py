"""Dashboard WebSocket stream placeholders."""
from fastapi import WebSocket


async def handle_dashboard_stream(websocket: WebSocket) -> None:
    """TODO: stream dashboard prices/positions/trades."""
    await websocket.accept()
    await websocket.send_json({"detail": "dashboard stream placeholder"})
    await websocket.close()
