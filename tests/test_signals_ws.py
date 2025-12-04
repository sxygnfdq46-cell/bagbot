"""Integration tests for the Signals WebSocket channel."""
import os

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

os.environ.setdefault("BAGBOT_JWT_SECRET", "test-signals-secret")

from backend.main import app  # noqa: E402  pylint: disable=wrong-import-position
from backend.security.jwt import create_access_token  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture()
def client() -> TestClient:
    """Return a FastAPI test client bound to the app."""

    return TestClient(app)


@pytest.fixture()
def auth_token() -> str:
    """Generate a short-lived JWT for websocket auth."""

    user_claims = {
        "id": "user-1",
        "name": "Signals Tester",
        "email": "signals@test.io",
        "role": "admin",
    }
    return create_access_token(user_claims)


def test_signals_websocket_requires_token(client: TestClient) -> None:
    """Connections without a token are rejected with the WS auth code."""

    with pytest.raises(WebSocketDisconnect) as excinfo:
        with client.websocket_connect("/ws/signals"):
            pass

    assert excinfo.value.code == 4401


def test_signals_websocket_streams_expected_channels(client: TestClient, auth_token: str) -> None:
    """Authenticated clients receive each signals channel payload in order."""

    with client.websocket_connect(f"/ws/signals?token={auth_token}") as websocket:
        expected_channels = ["signals_feed", "signals_status", "signals_logs", "signals_recent"]
        received_channels: list[str] = []

        for channel in expected_channels:
            payload = websocket.receive_json()
            received_channels.append(payload["channel"])

            if channel.endswith("status"):
                assert isinstance(payload["data"], dict)
                assert "providers" in payload["data"]
            else:
                assert isinstance(payload["data"], list)
                assert len(payload["data"]) > 0

        assert received_channels == expected_channels

        # Close after verifying broadcast payload cycle
