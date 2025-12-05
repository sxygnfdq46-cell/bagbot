import pytest

from backend.ws import manager


@pytest.mark.asyncio
async def test_broadcast_strategy_state(monkeypatch):
    captured = {}

    async def fake_ws(channel: str, event: str, payload=None, **kwargs):
        captured.update(
            {
                "channel": channel,
                "event": event,
                "payload": payload,
                **kwargs,
            }
        )
        return captured

    monkeypatch.setattr(manager, "websocket_broadcast", fake_ws)

    result = await manager.broadcast_strategy_state(
        "s-1",
        "started",
        {"extra": True},
    )

    assert result["channel"] == "signals"
    assert result["event"] == "strategy.started"
    assert result["payload"]["strategy_id"] == "s-1"
    assert result["payload"]["extra"] is True
