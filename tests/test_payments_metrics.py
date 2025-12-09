import pytest

from backend.payments.adapter import PaymentsClient, PaymentError


class MetricsSpy:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels):
        self.calls.append((name, labels))


@pytest.mark.parametrize(
    "scenario, code",
    [
        ("card_error", "card_error"),
        ("rate_limited", "rate_limited"),
        ("auth_error", "auth_error"),
        ("network_error", "network_error"),
    ],
)
def test_metrics_increment_for_fake_errors(scenario, code):
    metrics = MetricsSpy()
    client = PaymentsClient(use_fake=True, metrics_client=metrics)
    with pytest.raises(PaymentError):
        client.create_checkout_session(
            amount_cents=1000,
            plan="basic",
            user_id="user",
            success_url="https://ok",
            cancel_url="https://cancel",
            simulate_error=scenario,
        )
    assert ("payments_error_total", {"type": code}) in metrics.calls


def test_metrics_increment_for_normalized_real_error():
    metrics = MetricsSpy()

    class FakeSession:
        @staticmethod
        def create(**kwargs):
            raise TimeoutError("timeout")

    class FakeStripe:
        api_key = None
        checkout = type("checkout", (), {"Session": FakeSession})

    client = PaymentsClient(use_fake=False, stripe_module=FakeStripe, api_key="sk_test", metrics_client=metrics)
    with pytest.raises(PaymentError):
        client.create_checkout_session(
            amount_cents=1000,
            plan="basic",
            user_id="user",
            success_url="https://ok",
            cancel_url="https://cancel",
        )
    assert ("payments_error_total", {"type": "network_error"}) in metrics.calls
