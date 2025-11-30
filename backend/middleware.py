"""
Middleware for subscription-based access control
"""
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.models import Subscription, get_db
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def get_user_id_from_request(request: Request) -> Optional[str]:
    """
    Extract user_id from request headers or auth token
    Modify this based on your authentication implementation
    """
    # Example: Get from header
    user_id = request.headers.get("X-User-ID")
    
    # TODO: Replace with actual JWT token parsing or session validation
    # Example with JWT:
    # token = request.headers.get("Authorization", "").replace("Bearer ", "")
    # payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    # user_id = payload.get("user_id")
    
    return user_id


async def require_active_subscription(request: Request, call_next):
    """
    Middleware to check if user has an active subscription
    
    Usage:
        app.middleware("http")(require_active_subscription)
        
    Or apply to specific routes:
        @app.get("/api/protected-endpoint", dependencies=[Depends(check_subscription)])
    """
    # Skip subscription check for public endpoints
    public_paths = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/health",
        "/api/payments/create-checkout-session",
        "/api/payments/webhook",
    ]
    
    if any(request.url.path.startswith(path) for path in public_paths):
        return await call_next(request)
    
    # Get user ID from request
    user_id = get_user_id_from_request(request)
    
    if not user_id:
        # If no user_id, might be unauthenticated - let auth middleware handle it
        return await call_next(request)
    
    # Check subscription status
    db: Session = next(get_db())
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="No active subscription found. Please subscribe to access this feature."
            )
        
        if not subscription.is_active():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Subscription {subscription.status}. Please update your payment method."
            )
        
        # Add subscription info to request state for use in endpoints
        request.state.subscription = subscription
        
        return await call_next(request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking subscription: {e}")
        # Don't block requests on DB errors in production
        return await call_next(request)
    finally:
        db.close()


def check_subscription(user_id: str, db: Session) -> Subscription:
    """
    Dependency function to check subscription for specific routes
    
    Usage:
        @app.get("/api/premium-feature")
        async def premium_endpoint(
            subscription: Subscription = Depends(check_subscription)
        ):
            return {"plan": subscription.plan}
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription or not subscription.is_active():
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Active subscription required"
        )
    
    return subscription
