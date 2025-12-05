"""Integration test: toggle -> enqueue -> worker executes -> WS emit captured."""
from __future__ import annotations

import os
from typing import Any, Dict, List

import pytest
from httpx import AsyncClient

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from backend.crud import create_strategy as create_strategy_crud  # noqa: E402
from backend.db import session as db_session  # noqa: E402
from backend.main import app  # noqa: E402
from backend.models import Base  # noqa: E402
from backend.workers import tasks  # noqa: E402



@pytest.fixture(autouse=True)
async def _setup_database(tmp_path):
    db_url = f"sqlite+aiosqlite:///{tmp_path / 'worker_queue.db'}"
    db_session.configure_engine(db_url)

    async with db_session.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_session():
        async with db_session.AsyncSessionLocal() as session:
            yield session

    app.dependency_overrides[db_session.get_async_session] = _override_session
    yield
    app.dependency_overrides.pop(db_session.get_async_session, None)


@pytest.fixture
async def api_client():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


async def _seed_strategy(**overrides: Dict[str, Any]):
    payload = {
        "name": overrides.get("name", "Integration Strat"),
        "timeframe": overrides.get("timeframe", "5m"),
        "params": overrides.get("params", {"window": 5}),
        "description": overrides.get("description"),
        "enabled": overrides.get("enabled", False),
    }
    async with db_session.AsyncSessionLocal() as session:
        strategy = await create_strategy_crud(session, **payload)
        return strategy


@pytest.mark.parametrize("anyio_backend", ["asyncio"])
async def test_toggle_enqueue_and_worker_emits(monkeypatch, api_client, anyio_backend):
    events: List[Dict[str, Any]] = []
    captured_enqueue: Dict[str, Any] = {}

    async def fake_ws(channel: str, event: str, payload: Dict[str, Any] | None = None, **kwargs: Any):
        events.append({"channel": channel, "event": event, "payload": payload})

    def fake_enqueue(task_path: str, *args: Any, **kwargs: Any) -> str:
        captured_enqueue["task_path"] = task_path
        captured_enqueue["args"] = args
        captured_enqueue["kwargs"] = kwargs
        return "job-123"

    monkeypatch.setattr("backend.api.strategies.websocket_broadcast", fake_ws)
    monkeypatch.setattr("backend.services.manager.websocket_broadcast", fake_ws)
    monkeypatch.setattr("backend.api.strategies.enqueue_task", fake_enqueue)

    strategy = await _seed_strategy()

    resp = await api_client.post(f"/api/strategies/{strategy.id}/toggle")
    assert resp.status_code == 200
    payload = resp.json()

    assert payload["task_id"] == "job-123"
    assert captured_enqueue["task_path"].endswith("strategy_toggle")

    # Simulate worker execution directly
    def fake_start_strategy(strategy_id: str):
        events.append(
            {"channel": "signals", "event": "strategy.started", "payload": {"strategy_id": strategy_id}}
        )
        return {"strategy_id": strategy_id, "status": "started"}

    def fake_stop_strategy(strategy_id: str):
        events.append(
            {"channel": "signals", "event": "strategy.stopped", "payload": {"strategy_id": strategy_id}}
        )
        return {"strategy_id": strategy_id, "status": "stopped"}

    monkeypatch.setattr(tasks, "start_strategy", fake_start_strategy)
    monkeypatch.setattr(tasks, "stop_strategy", fake_stop_strategy)

    worker_result = tasks.strategy_toggle(strategy.id, payload["status"])
    assert worker_result["status"] == payload["status"]

    assert any(ev["event"] == "strategy.started" for ev in events) or any(
        ev["event"] == "strategy.stopped" for ev in events
    )
    assert any(ev["payload"].get("strategy_id") == strategy.id for ev in events)
