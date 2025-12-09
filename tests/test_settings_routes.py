"""Route tests for settings and API keys."""
from __future__ import annotations

import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("BAGBOT_JWT_SECRET", "test-settings-secret")

from backend.main import app  # noqa: E402  pylint: disable=wrong-import-position
from backend.security.jwt import create_access_token  # noqa: E402  pylint: disable=wrong-import-position
from backend.services.settings_service import InMemorySettingsStore, settings_service  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture(autouse=True)
def reset_settings_store() -> Generator[None, None, None]:
    """Reset in-memory store between tests."""

    settings_service._store = InMemorySettingsStore()  # type: ignore[attr-defined]
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def user_token() -> str:
    claims = {"id": "user-1", "name": "User", "email": "u@test.io", "role": "user"}
    return create_access_token(claims)


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_get_set_preferences_auth(client: TestClient, user_token: str) -> None:
    """Preferences require auth and persist per user."""

    resp = client.get("/api/settings/preferences")
    assert resp.status_code == 401

    resp = client.get("/api/settings/preferences", headers=_auth_headers(user_token))
    assert resp.status_code == 200
    assert resp.json()["notify_on_failure"] is True

    update = {"notify_on_failure": False, "max_worker_count": 3}
    resp = client.post("/api/settings/preferences", headers=_auth_headers(user_token), json=update)
    assert resp.status_code == 200
    assert resp.json()["max_worker_count"] == 3

    resp = client.get("/api/settings/preferences", headers=_auth_headers(user_token))
    assert resp.json()["notify_on_failure"] is False


def test_api_key_add_redaction(client: TestClient, user_token: str) -> None:
    """Added API keys return redacted secrets when listed."""

    secret = "supersecret1234"
    resp = client.post(
        "/api/settings/api-keys",
        headers=_auth_headers(user_token),
        json={"name": "sentry", "key": secret},
    )
    assert resp.status_code == 201
    redacted = resp.json()["key_redacted"]
    assert redacted.startswith("******")
    assert redacted.endswith(secret[-4:])

    resp = client.get("/api/settings/api-keys", headers=_auth_headers(user_token))
    data = resp.json()
    assert len(data) == 1
    assert data[0]["key_redacted"] == redacted


def test_api_key_encryption_at_rest(client: TestClient, user_token: str) -> None:
    """Secrets are stored encrypted at rest in the store."""

    secret = "supersecret1234"
    client.post(
        "/api/settings/api-keys",
        headers=_auth_headers(user_token),
        json={"name": "twilio", "key": secret},
    )
    stored = settings_service._store.list_api_keys("user-1")  # type: ignore[attr-defined]
    assert stored
    assert stored[0]["encrypted_key"] != secret

    decrypted = settings_service.get_api_key("user-1", stored[0]["id"])
    assert decrypted == secret
