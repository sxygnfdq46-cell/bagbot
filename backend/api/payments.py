"""Minimal Stripe payments endpoints for tests."""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

try:  # pragma: no cover - stripe may be absent in tests
    import stripe
except Exception:  # Minimal stub if stripe is missing
    import json

    class _DummySession:
        @staticmethod
        def create(**kwargs):
            class _Result:
                url = "https://example.com/checkout"
                id = "cs_dummy"

            return _Result()

    class _DummyWebhook:
        @staticmethod
        def construct_event(payload, sig, secret):
            try:
                return json.loads(payload) if isinstance(payload, (bytes, str)) else {}
            except Exception:
                return {}

    class _DummySubscription:
        @staticmethod
        def retrieve(subscription_id):  # pragma: no cover - only for patching in tests
            return {"id": subscription_id, "status": "active"}

    class DummyStripe:
        api_key = ""
        checkout = type("checkout", (), {"Session": _DummySession})
        Subscription = _DummySubscription
        Webhook = _DummyWebhook

    stripe = DummyStripe()  # type: ignore

from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel

from backend.models import Base, SessionLocal, engine, get_db, Subscription

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Allowed plans for tests
ALLOWED_PLANS = {"basic": 10_00, "pro": 20_00, "enterprise": 50_00}


class CheckoutPayload(BaseModel):
    plan: str
    user_id: str
    success_url: str
    cancel_url: str


def _get_stripe():
    key = os.getenv("STRIPE_SECRET_KEY", "sk_test_stub")
    stripe.api_key = key
    return stripe


@router.post("/create-checkout-session")
async def create_checkout_session(payload: CheckoutPayload, db=Depends(get_db)):
    if payload.plan not in ALLOWED_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if Base is not None and engine is not None:
        Base.metadata.create_all(bind=engine)

    # Check existing active subscription
    existing = (
        db.query(Subscription)
        .filter(Subscription.user_id == payload.user_id)
        .first()
    )
    if existing and existing.is_active():
        raise HTTPException(status_code=400, detail="User already has an active subscription")

    price_cents = ALLOWED_PLANS[payload.plan]
    _get_stripe()
    session = stripe.checkout.Session.create(  # type: ignore[attr-defined]
        payment_method_types=["card"],
        mode="subscription",
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": payload.plan},
                    "recurring": {"interval": "month"},
                    "unit_amount": price_cents,
                },
                "quantity": 1,
            }
        ],
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        metadata={"user_id": payload.user_id, "plan": payload.plan},
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/webhook")
async def stripe_webhook(request: Request, db=Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    if Base is not None and engine is not None:
        Base.metadata.create_all(bind=engine)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, "whsec_test")  # type: ignore[attr-defined]
    except Exception as exc:  # pragma: no cover - test catches
        raise HTTPException(status_code=400, detail=str(exc))

    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        plan = data.get("metadata", {}).get("plan")
        sub_id = data.get("subscription")
        if user_id and plan and sub_id:
            sub = Subscription(
                user_id=user_id,
                stripe_subscription_id=sub_id,
                plan=plan,
                status="active",
                current_period_end=datetime.utcnow(),
            )
            db.add(sub)
            db.commit()
        return {"status": "success"}

    if event_type == "customer.subscription.updated":
        sub_id = data.get("id")
        if sub_id:
            sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == sub_id).first()
            if sub:
                sub.status = data.get("status", sub.status)
                sub.plan = data.get("metadata", {}).get("plan", sub.plan)
                ts = data.get("current_period_end")
                if ts:
                    sub.current_period_end = datetime.utcfromtimestamp(ts)
                db.commit()
        return {"status": "updated"}

    if event_type == "customer.subscription.deleted":
        sub_id = data.get("id")
        if sub_id:
            sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == sub_id).first()
            if sub:
                sub.status = "canceled"
                db.commit()
        return {"status": "deleted"}

    if event_type == "invoice.payment_failed":
        sub_id = data.get("subscription")
        if sub_id:
            sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == sub_id).first()
            if sub:
                sub.status = "past_due"
                db.commit()
        return {"status": "failed"}

    return {"status": "ignored"}
