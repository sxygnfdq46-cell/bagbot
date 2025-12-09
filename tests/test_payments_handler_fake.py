import os

from fastapi.testclient import TestClient

from backend.main import app


def test_create_checkout_session_fake_mode(monkeypatch):
    monkeypatch.setenv("PAYMENTS_FAKE_MODE", "1")
    monkeypatch.delenv("PAYMENTS_FAKE_SCENARIO", raising=False)
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    payload = {
        "plan": "basic",
        "user_id": "user-xyz",
        "success_url": "https://success",
        "cancel_url": "https://cancel",
    }

    with TestClient(app) as client:
        resp = client.post("/api/payments/create-checkout-session", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "checkout_url" in data and "session_id" in data


def test_create_checkout_session_fake_card_decline(monkeypatch):
    monkeypatch.setenv("PAYMENTS_FAKE_MODE", "1")
    monkeypatch.setenv("PAYMENTS_FAKE_SCENARIO", "card_error")
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    payload = {
        "plan": "basic",
        "user_id": "user-abc",
        "success_url": "https://success",
        "cancel_url": "https://cancel",
    }

    with TestClient(app) as client:
        resp = client.post("/api/payments/create-checkout-session", json=payload)
    assert resp.status_code == 400
    assert "card" in resp.json()["detail"].lower()
