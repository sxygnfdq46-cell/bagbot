"""Integration tests for the Brain WebSocket decision flow."""
import os

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

os.environ.setdefault("BAGBOT_JWT_SECRET", "test-brain-secret")
os.environ.setdefault("BRAIN_FAKE_MODE", "1")

from backend.api.ws import brain_ws  # noqa: E402  pylint: disable=wrong-import-position
from backend.main import app  # noqa: E402  pylint: disable=wrong-import-position
from backend.security.jwt import create_access_token  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture(autouse=True)
def _reset_state():
    brain_ws.METRICS.connects_total = 0
    brain_ws.METRICS.disconnects_total = 0
    brain_ws.METRICS.decisions_total.clear()
    brain_ws._ACTIVE_CONNECTIONS.clear()
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def auth_token() -> str:
    claims = {
        "id": "user-brain",
        "name": "Brain WS Tester",
        "email": "brain@test.io",
        "role": "admin",
    }
    return create_access_token(claims)


def test_brain_ws_requires_token(client: TestClient) -> None:
    with pytest.raises(WebSocketDisconnect) as excinfo:
        with client.websocket_connect("/ws/brain"):
            pass

    assert excinfo.value.code == 4401


def test_brain_ws_handshake_and_decision_flow(client: TestClient, auth_token: str) -> None:
    with client.websocket_connect(f"/ws/brain?token={auth_token}") as websocket:
        handshake = websocket.receive_json()
        assert handshake["type"] == "brain-online"

        payload = {
            "request_id": "req-1",
            "market_snapshot": {
                "type": "momentum",
                "strength": 0.3,
                "confidence": 0.7,
                "metadata": {"span": "1m"},
            },
        }
        websocket.send_json(payload)

        response = websocket.receive_json()
        assert response["type"] == "brain-decision"
        assert response["request_id"] == payload["request_id"]
        assert response["action"] == "hold"
        assert response["confidence"] == 0.5
        assert response["reason"] == "fake_mode enabled"

        assert brain_ws.METRICS.connects_total == 1
        assert brain_ws.METRICS.decisions_total["hold"] == 1

    assert brain_ws.METRICS.disconnects_total == 1
    assert len(brain_ws._ACTIVE_CONNECTIONS) == 0


def test_brain_ws_handles_invalid_payload(client: TestClient, auth_token: str) -> None:
    with client.websocket_connect(f"/ws/brain?token={auth_token}") as websocket:
        _ = websocket.receive_json()  # handshake

        websocket.send_json("oops")
        error = websocket.receive_json()

        assert error["type"] == "brain-error"
        assert error["detail"] == "invalid payload"