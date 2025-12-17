"""
Example endpoints demonstrating subscription middleware usage
"""
from fastapi import APIRouter, Depends
from backend.middleware import check_subscription
from backend.models import Subscription, get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/premium", tags=["premium"])


@router.get("/features")
async def get_premium_features(
    user_id: str,  # TODO: Extract from JWT token in production
    subscription: Subscription = Depends(lambda: check_subscription),
    db: Session = Depends(get_db)
):
    """
    Example endpoint that requires active subscription
    
    Usage:
    - User must have active subscription to access
    - Returns features based on subscription plan
    """
    # Get subscription for user
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    
    if not sub or not sub.is_active():
        return {"error": "No active subscription"}
    
    # Return features based on plan
    features = {
        "basic": ["feature_a", "feature_b"],
        "pro": ["feature_a", "feature_b", "feature_c", "feature_d"],
        "enterprise": ["feature_a", "feature_b", "feature_c", "feature_d", "feature_e", "priority_support"]
    }
    
    return {
        "plan": sub.plan,
        "status": sub.status,
        "features": features.get(sub.plan, []),
        "expires": sub.current_period_end.isoformat()
    }


@router.get("/stats")
async def get_subscription_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user's subscription information
    
    This endpoint doesn't require active subscription,
    just returns current subscription status
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        return {
            "has_subscription": False,
            "message": "No subscription found"
        }
    
    return {
        "has_subscription": True,
        "is_active": subscription.is_active(),
        "plan": subscription.plan,
        "status": subscription.status,
        "current_period_end": subscription.current_period_end.isoformat(),
        "stripe_customer_id": subscription.stripe_customer_id
    }


# Example of route-specific dependency
@router.get("/advanced-analytics")
async def advanced_analytics(
    subscription: Subscription = Depends(check_subscription)
):
    """
    Advanced analytics endpoint - requires Pro or Enterprise plan
    """
    if subscription.plan not in ["pro", "enterprise"]:
        return {
            "error": "This feature requires Pro or Enterprise plan",
            "current_plan": subscription.plan,
            "upgrade_url": "/api/payments/create-checkout-session"
        }
    
    # Return advanced analytics
    return {
        "analytics": "advanced_data",
        "plan": subscription.plan
    }
