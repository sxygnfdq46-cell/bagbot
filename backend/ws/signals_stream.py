"""Signals WebSocket stream placeholders."""
from fastapi import WebSocket


async def handle_signals_stream(websocket: WebSocket) -> None:
    """TODO: stream live signals."""
    await websocket.accept()
    await websocket.send_json({"detail": "signals stream placeholder"})
    await websocket.close()
