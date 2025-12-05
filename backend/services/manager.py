"""Minimal stub for WebSocket / broadcast manager references."""

async def websocket_broadcast(channel: str, payload: dict):
    """Simulate WS broadcast in tests."""
    return {"channel": channel, "payload": payload}
