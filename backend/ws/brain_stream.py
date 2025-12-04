"""Brain telemetry WebSocket stream placeholders."""
from fastapi import WebSocket


async def handle_brain_events(websocket: WebSocket) -> None:
    """TODO: stream brain events/metrics."""
    await websocket.accept()
    await websocket.send_json({"detail": "brain events placeholder"})
    await websocket.close()
