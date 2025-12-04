"""Live charts WebSocket stream placeholders."""
from fastapi import WebSocket


async def handle_charts_stream(websocket: WebSocket) -> None:
    """TODO: stream live candles."""
    await websocket.accept()
    await websocket.send_json({"detail": "charts stream placeholder"})
    await websocket.close()
