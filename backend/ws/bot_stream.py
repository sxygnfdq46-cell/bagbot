"""Bot telemetry/log stream placeholders."""
from fastapi import WebSocket


async def handle_bot_telemetry(websocket: WebSocket) -> None:
    """TODO: stream bot telemetry."""
    await websocket.accept()
    await websocket.send_json({"detail": "bot telemetry placeholder"})
    await websocket.close()


async def handle_bot_logs(websocket: WebSocket) -> None:
    """TODO: stream bot logs."""
    await websocket.accept()
    await websocket.send_json({"detail": "bot logs placeholder"})
    await websocket.close()
