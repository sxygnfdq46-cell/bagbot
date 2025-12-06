"""Route tests for bot control endpoints."""
from __future__ import annotations

import os
from datetime import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("BAGBOT_JWT_SECRET", "test-bot-secret")

from backend.main import app  # noqa: E402  pylint: disable=wrong-import-position
from backend.security.jwt import create_access_token  # noqa: E402  pylint: disable=wrong-import-position
from backend.services.bot_control import bot_control_service  # noqa: E402  pylint: disable=wrong-import-position
from backend.services.settings_service import InMemorySettingsStore, settings_service  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture(autouse=True)
def reset_state() -> Generator[None, None, None]:
    """Reset bot state and audit store between tests."""

    bot_control_service._state = "stopped"  # type: ignore[attr-defined]
    bot_control_service._updated_at = datetime.utcnow()  # type: ignore[attr-defined]
    settings_service._store = InMemorySettingsStore()  # type: ignore[attr-defined]
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def user_token() -> str:
    claims = {"id": "user-1", "name": "User", "email": "u@test.io", "role": "user"}
    return create_access_token(claims)


@pytest.fixture()
def admin_token() -> str:
    claims = {"id": "admin-1", "name": "Admin", "email": "a@test.io", "role": "admin"}
    return create_access_token(claims)


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_state_requires_auth(client: TestClient) -> None:
    resp = client.get("/api/bot/state")
    assert resp.status_code == 401


def test_control_requires_admin(client: TestClient, user_token: str) -> None:
    resp = client.post("/api/bot/start", headers=_auth_headers(user_token))
    assert resp.status_code == 403


def test_start_records_audit(client: TestClient, admin_token: str) -> None:
    resp = client.post("/api/bot/start", headers=_auth_headers(admin_token))
    assert resp.status_code == 202
    assert resp.json()["state"] == "running"

    entries = settings_service.audit_entries()
    assert any(entry["action"] == "bot.running" for entry in entries)
