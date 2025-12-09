import sys
from pathlib import Path

import pytest

from backend.payments.adapter import PaymentsClient, PaymentError


ROOT = Path(__file__).resolve().parents[1]


def test_import_has_no_stripe_side_effects(monkeypatch):
    monkeypatch.delenv("PAYMENTS_FAKE_MODE", raising=False)
    sys.modules.pop("stripe", None)
    from backend.payments import adapter  # noqa: WPS433

    assert "stripe" not in sys.modules


def test_fake_mode_success():
    client = PaymentsClient(use_fake=True)
    result = client.create_checkout_session(
        amount_cents=1000,
        plan="basic",
        user_id="user-1",
        success_url="https://ok",
        cancel_url="https://cancel",
    )
    assert result.checkout_url
    assert result.session_id.startswith("cs_test_")


@pytest.mark.parametrize(
    "scenario, code",
    [
        ("card_error", "card_error"),
        ("rate_limited", "rate_limited"),
        ("auth_error", "auth_error"),
        ("network_error", "network_error"),
    ],
)
def test_fake_mode_errors(scenario, code):
    client = PaymentsClient(use_fake=True)
    with pytest.raises(PaymentError) as excinfo:
        client.create_checkout_session(
            amount_cents=1000,
            plan="basic",
            user_id="user-1",
            success_url="https://ok",
            cancel_url="https://cancel",
            simulate_error=scenario,
        )
    assert excinfo.value.code == code


def test_timeout_passed_to_stripe():
    captured = {}

    class FakeSession:
        @staticmethod
        def create(**kwargs):
            captured.update(kwargs)
            class _Result:
                url = "https://example.com"
                id = "cs_test"
                _last_response = {"status": 200}
            return _Result()

    class FakeStripe:
        api_key = None
        checkout = type("checkout", (), {"Session": FakeSession})

    client = PaymentsClient(use_fake=False, stripe_module=FakeStripe, api_key="sk_test", timeout_s=3.5)
    client.create_checkout_session(
        amount_cents=1000,
        plan="basic",
        user_id="user-1",
        success_url="https://ok",
        cancel_url="https://cancel",
    )
    assert captured["timeout"] == 3.5
    assert captured["idempotency_key"].startswith("req_")


def test_construct_webhook_fake_mode():
    client = PaymentsClient(use_fake=True)
    event = client.construct_webhook_event(b"{\"type\":\"ping\"}", "sig", "secret")
    assert event["type"] == "ping"
