"""
Payment endpoints for Stripe integration
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.models import Subscription, get_db
from datetime import datetime
import stripe
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Stripe configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID_BASIC = os.getenv("STRIPE_PRICE_ID_BASIC", "")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO", "")
STRIPE_PRICE_ID_ENTERPRISE = os.getenv("STRIPE_PRICE_ID_ENTERPRISE", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


class CheckoutSessionRequest(BaseModel):
    """Request model for creating checkout session"""
    plan: str  # 'basic', 'pro', 'enterprise'
    user_id: str
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    """Response model with Stripe checkout session URL"""
    checkout_url: str
    session_id: str


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    db: Session = Depends(get_db)
):
    """
    Create a Stripe checkout session for subscription
    
    Plans:
    - basic: Basic features
    - pro: Advanced features + priority support
    - enterprise: All features + dedicated support
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Please set STRIPE_SECRET_KEY."
        )
    
    # Map plan to Stripe Price ID
    price_ids = {
        "basic": STRIPE_PRICE_ID_BASIC,
        "pro": STRIPE_PRICE_ID_PRO,
        "enterprise": STRIPE_PRICE_ID_ENTERPRISE,
    }
    
    price_id = price_ids.get(request.plan)
    if not price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan: {request.plan}. Choose from: basic, pro, enterprise"
        )
    
    try:
        # Check if user already has a subscription
        existing_sub = db.query(Subscription).filter(
            Subscription.user_id == request.user_id
        ).first()
        
        if existing_sub and existing_sub.is_active():
            raise HTTPException(
                status_code=400,
                detail="User already has an active subscription"
            )
        
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            customer_email=f"{request.user_id}@bagbot.app",  # Replace with actual email
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "user_id": request.user_id,
                "plan": request.plan,
            }
        )
        
        logger.info(f"Created checkout session for user {request.user_id}, plan {request.plan}")
        
        return CheckoutSessionResponse(
            checkout_url=checkout_session.url,
            session_id=checkout_session.id
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhook events
    
    Events handled:
    - checkout.session.completed: Create subscription record
    - customer.subscription.updated: Update subscription status
    - customer.subscription.deleted: Mark subscription as canceled
    - invoice.payment_failed: Update subscription to past_due
    """
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Webhook secret not configured"
        )
    
    # Get raw body for signature verification
    payload = await request.body()
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid webhook payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]
    
    logger.info(f"Processing webhook event: {event_type}")
    
    try:
        if event_type == "checkout.session.completed":
            # Payment successful, create subscription record
            session = data
            user_id = session["metadata"].get("user_id")
            plan = session["metadata"].get("plan")
            subscription_id = session.get("subscription")
            customer_id = session.get("customer")
            
            if not all([user_id, plan, subscription_id]):
                logger.error("Missing required metadata in checkout session")
                return {"status": "error", "message": "Missing metadata"}
            
            # Get subscription details from Stripe
            stripe_sub = stripe.Subscription.retrieve(subscription_id)
            
            # Create or update subscription in database
            db_subscription = db.query(Subscription).filter(
                Subscription.user_id == user_id
            ).first()
            
            if db_subscription:
                db_subscription.stripe_customer_id = customer_id
                db_subscription.stripe_subscription_id = subscription_id
                db_subscription.plan = plan
                db_subscription.status = stripe_sub["status"]
                db_subscription.current_period_end = datetime.fromtimestamp(
                    stripe_sub["current_period_end"]
                )
                db_subscription.updated_at = datetime.utcnow()
            else:
                db_subscription = Subscription(
                    user_id=user_id,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    plan=plan,
                    status=stripe_sub["status"],
                    current_period_end=datetime.fromtimestamp(
                        stripe_sub["current_period_end"]
                    )
                )
                db.add(db_subscription)
            
            db.commit()
            logger.info(f"Subscription created/updated for user {user_id}")
            
        elif event_type == "customer.subscription.updated":
            # Subscription status changed
            subscription = data
            subscription_id = subscription["id"]
            
            db_subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_id
            ).first()
            
            if db_subscription:
                db_subscription.status = subscription["status"]
                db_subscription.plan = subscription["metadata"].get("plan", db_subscription.plan)
                db_subscription.current_period_end = datetime.fromtimestamp(
                    subscription["current_period_end"]
                )
                db_subscription.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"Subscription {subscription_id} updated to status {subscription['status']}")
            
        elif event_type == "customer.subscription.deleted":
            # Subscription canceled
            subscription = data
            subscription_id = subscription["id"]
            
            db_subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_id
            ).first()
            
            if db_subscription:
                db_subscription.status = "canceled"
                db_subscription.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"Subscription {subscription_id} canceled")
                
        elif event_type == "invoice.payment_failed":
            # Payment failed
            invoice = data
            subscription_id = invoice.get("subscription")
            
            if subscription_id:
                db_subscription = db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == subscription_id
                ).first()
                
                if db_subscription:
                    db_subscription.status = "past_due"
                    db_subscription.updated_at = datetime.utcnow()
                    db.commit()
                    logger.warning(f"Payment failed for subscription {subscription_id}")
        
        else:
            logger.info(f"Unhandled event type: {event_type}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Webhook processing failed")
