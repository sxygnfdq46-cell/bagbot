"""Admin log WebSocket stream placeholders."""
from fastapi import WebSocket


async def handle_admin_logs(websocket: WebSocket) -> None:
    """TODO: stream admin logs."""
    await websocket.accept()
    await websocket.send_json({"detail": "admin logs placeholder"})
    await websocket.close()
