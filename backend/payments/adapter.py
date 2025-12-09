from __future__ import annotations

"""Stripe adapter with fake mode, lazy init, and normalized errors."""

import json
import logging
import os
import sys
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional, Protocol

logger = logging.getLogger(__name__)


class PaymentError(Exception):
    def __init__(self, code: str, message: str, *, extra: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.extra = extra or {}


@dataclass
class PaymentResult:
    checkout_url: str
    session_id: str
    raw: Dict[str, Any]


def _bool_env(name: str) -> bool:
    return os.getenv(name, "").lower() in {"1", "true", "yes", "on"}


class _MetricsClient(Protocol):
    def inc(self, name: str, labels: Dict[str, str]) -> None:
        ...


def normalize_error(exc: Exception) -> PaymentError:
    name = exc.__class__.__name__
    msg = str(exc)
    lower = msg.lower()

    # Stripe error-like mapping
    if "card" in lower and "decline" in lower:
        return PaymentError("card_error", msg)
    if "rate" in lower and "limit" in lower:
        return PaymentError("rate_limited", msg)
    if "auth" in lower or "api key" in lower:
        return PaymentError("auth_error", msg)
    if "timeout" in lower or "network" in lower or "connection" in lower:
        return PaymentError("network_error", msg)
    if name in {"CardError", "CardDeclinedError"}:
        return PaymentError("card_error", msg)
    if name in {"RateLimitError"}:
        return PaymentError("rate_limited", msg)
    if name in {"AuthenticationError", "PermissionError"}:
        return PaymentError("auth_error", msg)
    if name in {"APIConnectionError", "TimeoutError"}:
        return PaymentError("network_error", msg)
    return PaymentError("unknown_error", msg)


class _FakeStripeBackend:
    def __init__(self, scenario: Optional[str] = None):
        self.scenario = scenario

    def create_checkout_session(self, **kwargs) -> PaymentResult:
        scenario = kwargs.get("simulate_error") or self.scenario
        if scenario:
            if scenario == "card_error":
                raise PaymentError("card_error", "card declined")
            if scenario == "rate_limited":
                raise PaymentError("rate_limited", "rate limited")
            if scenario == "auth_error":
                raise PaymentError("auth_error", "invalid auth")
            if scenario == "network_error":
                raise PaymentError("network_error", "network issue")
        session_id = f"cs_test_{uuid.uuid4().hex[:12]}"
        return PaymentResult(
            checkout_url="https://example.com/checkout",
            session_id=session_id,
            raw={"id": session_id, "url": "https://example.com/checkout"},
        )

    def construct_event(self, payload: bytes | str, sig: str, secret: str) -> Dict[str, Any]:
        try:
            if isinstance(payload, bytes):
                payload = payload.decode()
            if isinstance(payload, str):
                return json.loads(payload) if payload else {}
            if isinstance(payload, dict):
                return payload
            return {}
        except Exception:
            return {}


class PaymentsClient:
    def __init__(
        self,
        *,
        use_fake: Optional[bool] = None,
        stripe_module: Any = None,
        api_key: Optional[str] = None,
        timeout_s: Optional[float] = None,
        retries: int = 0,
        metrics_client: Optional[_MetricsClient] = None,
    ) -> None:
        env_fake = _bool_env("PAYMENTS_FAKE_MODE")
        no_key = not os.getenv("STRIPE_SECRET_KEY")
        self.use_fake = use_fake if use_fake is not None else (env_fake or no_key)
        self._stripe_module = stripe_module
        self._api_key = api_key
        self.timeout_s = timeout_s or float(os.getenv("STRIPE_TIMEOUT_S", "3"))
        self.retries = retries
        self._stripe_loaded = False
        self._fake_scenario = os.getenv("PAYMENTS_FAKE_SCENARIO") or None
        self._metrics = metrics_client

    def _get_request_id(self, request_id: Optional[str]) -> str:
        return request_id or f"req_{uuid.uuid4().hex[:12]}"

    def _count_error(self, code: str) -> None:
        if not self._metrics:
            return
        try:
            self._metrics.inc("payments_error_total", {"type": code})
        except Exception:
            logger.debug("metrics increment failed", exc_info=True)

    def _load_stripe(self):
        if self.use_fake:
            return _FakeStripeBackend(self._fake_scenario)

        if self._stripe_module is not None:
            self._stripe_loaded = True
            return self._stripe_module

        try:
            import stripe  # type: ignore
        except Exception as exc:  # pragma: no cover - handled in mapping
            raise PaymentError("auth_error", f"Stripe import failed: {exc}") from exc

        key = self._api_key or os.getenv("STRIPE_SECRET_KEY") or ""
        if not key:
            raise PaymentError("auth_error", "Stripe API key missing")

        stripe.api_key = key
        self._stripe_module = stripe
        self._stripe_loaded = True
        return stripe

    def create_checkout_session(
        self,
        *,
        amount_cents: int,
        plan: str,
        user_id: str,
        success_url: str,
        cancel_url: str,
        request_id: Optional[str] = None,
        simulate_error: Optional[str] = None,
    ) -> PaymentResult:
        stripe_mod = self._load_stripe()

        if self.use_fake:
            try:
                return stripe_mod.create_checkout_session(simulate_error=simulate_error)
            except PaymentError as exc:
                self._count_error(exc.code)
                raise

        try:
            session = stripe_mod.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {"name": plan},
                            "recurring": {"interval": "month"},
                            "unit_amount": amount_cents,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"user_id": user_id, "plan": plan},
                idempotency_key=self._get_request_id(request_id),
                timeout=self.timeout_s,
            )
            return PaymentResult(checkout_url=session.url, session_id=session.id, raw=getattr(session, "_last_response", {}) or {})
        except Exception as exc:
            err = normalize_error(exc)
            self._count_error(err.code)
            raise err

    def construct_webhook_event(self, payload: bytes | str, sig: str, secret: str) -> Dict[str, Any]:
        if "stripe" in sys.modules and hasattr(sys.modules["stripe"], "Webhook"):
            stripe_mod = sys.modules["stripe"]
        else:
            stripe_mod = self._load_stripe()
        if self.use_fake and isinstance(stripe_mod, _FakeStripeBackend):
            return stripe_mod.construct_event(payload, sig, secret)
        try:
            return stripe_mod.Webhook.construct_event(payload, sig, secret)
        except Exception as exc:
            err = normalize_error(exc)
            self._count_error(err.code)
            raise err


__all__ = ["PaymentsClient", "PaymentError", "PaymentResult", "normalize_error"]
