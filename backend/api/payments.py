"""Payments endpoints using the Stripe adapter (fake-mode friendly)."""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel

from backend.models import Base, SessionLocal, engine, get_db, Subscription
from backend.payments import PaymentsClient, PaymentError

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Allowed plans for tests
ALLOWED_PLANS = {"basic": 10_00, "pro": 20_00, "enterprise": 50_00}


def _client() -> PaymentsClient:
    return PaymentsClient()


class CheckoutPayload(BaseModel):
    plan: str
    user_id: str
    success_url: str
    cancel_url: str


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
    client = _client()
    try:
        session = client.create_checkout_session(
            amount_cents=price_cents,
            plan=payload.plan,
            user_id=payload.user_id,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
        )
    except PaymentError as exc:
        code = exc.code
        if code == "card_error":
            raise HTTPException(status_code=400, detail=exc.message)
        if code == "rate_limited":
            raise HTTPException(status_code=429, detail=exc.message)
        if code == "auth_error":
            raise HTTPException(status_code=401, detail=exc.message)
        if code == "network_error":
            raise HTTPException(status_code=502, detail=exc.message)
        raise HTTPException(status_code=500, detail=exc.message)

    return {"checkout_url": session.checkout_url, "session_id": session.session_id}


@router.post("/webhook")
async def stripe_webhook(request: Request, db=Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    if Base is not None and engine is not None:
        Base.metadata.create_all(bind=engine)

    client = _client()
    try:
        event = client.construct_webhook_event(payload, sig_header, "whsec_test")
    except PaymentError as exc:
        raise HTTPException(status_code=400, detail=exc.message)

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
