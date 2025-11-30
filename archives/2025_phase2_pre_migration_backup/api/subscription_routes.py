"""
Subscription API Routes

Endpoints for managing subscriptions and API tokens.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..backend.subscription_manager import (
    SubscriptionManager,
    SubscriptionTier,
    APIToken
)

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

# Initialize manager
subscription_manager = SubscriptionManager()


class CreateTokenRequest(BaseModel):
    """Request to create a new API token."""
    user_id: str
    tier: str  # 'free', 'pro', or 'enterprise'
    name: Optional[str] = None
    expires_in_days: Optional[int] = None


class TokenResponse(BaseModel):
    """Response with token information."""
    token: Optional[str] = None  # Only returned on creation
    token_prefix: str
    name: str
    tier: str
    status: str
    created_at: str
    expires_at: Optional[str]
    total_api_calls: int
    api_calls_today: int
    daily_call_limit: int


class UsageStatsResponse(BaseModel):
    """Usage statistics response."""
    total_calls: int
    avg_response_time_ms: float
    endpoints: dict
    period: dict


class TierLimitsResponse(BaseModel):
    """Tier limits response."""
    tier: str
    max_api_calls_per_day: int
    max_api_calls_per_minute: int
    max_concurrent_strategies: int
    max_positions: int
    max_order_value_usd: float
    can_use_advanced_strategies: bool
    can_access_tick_data: bool
    can_use_multi_market: bool
    websocket_access: bool
    priority_support: bool
    custom_indicators: bool


def verify_admin_token(authorization: str = Header(None)) -> str:
    """Verify admin token from Authorization header."""
    import os
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format"
        )
    
    token = authorization.replace("Bearer ", "")
    admin_token = os.getenv("ADMIN_TOKEN")
    
    if not admin_token or token != admin_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin token"
        )
    
    return token


@router.post("/tokens", response_model=TokenResponse)
async def create_token(
    request: CreateTokenRequest,
    _: str = Depends(verify_admin_token)
):
    """
    Create a new API token (admin only).
    
    Args:
        request: Token creation request
        
    Returns:
        Token information including the token string
    """
    try:
        tier = SubscriptionTier(request.tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: free, pro, enterprise"
        )
    
    token_string, token_obj = subscription_manager.create_token(
        user_id=request.user_id,
        tier=tier,
        name=request.name,
        expires_in_days=request.expires_in_days
    )
    
    return TokenResponse(
        token=token_string,  # Only returned on creation
        token_prefix=token_obj.token_prefix,
        name=token_obj.name,
        tier=token_obj.tier,
        status=token_obj.status,
        created_at=token_obj.created_at.isoformat(),
        expires_at=token_obj.expires_at.isoformat() if token_obj.expires_at else None,
        total_api_calls=token_obj.total_api_calls,
        api_calls_today=token_obj.api_calls_today,
        daily_call_limit=token_obj.daily_call_limit
    )


@router.get("/tokens/{user_id}", response_model=List[TokenResponse])
async def get_user_tokens(
    user_id: str,
    _: str = Depends(verify_admin_token)
):
    """
    Get all tokens for a user (admin only).
    
    Args:
        user_id: User identifier
        
    Returns:
        List of tokens
    """
    tokens = subscription_manager.get_user_tokens(user_id)
    
    return [
        TokenResponse(
            token_prefix=token.token_prefix,
            name=token.name,
            tier=token.tier,
            status=token.status,
            created_at=token.created_at.isoformat(),
            expires_at=token.expires_at.isoformat() if token.expires_at else None,
            total_api_calls=token.total_api_calls,
            api_calls_today=token.api_calls_today,
            daily_call_limit=token.daily_call_limit
        )
        for token in tokens
    ]


@router.delete("/tokens/{token_id}")
async def revoke_token(
    token_id: int,
    reason: str = "Admin revocation",
    _: str = Depends(verify_admin_token)
):
    """
    Revoke an API token (admin only).
    
    Args:
        token_id: Token ID to revoke
        reason: Reason for revocation
        
    Returns:
        Success message
    """
    success = subscription_manager.revoke_token(token_id, reason)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found"
        )
    
    return {"message": "Token revoked successfully", "reason": reason}


@router.put("/tokens/{token_id}/upgrade")
async def upgrade_token(
    token_id: int,
    new_tier: str,
    _: str = Depends(verify_admin_token)
):
    """
    Upgrade a token to a new tier (admin only).
    
    Args:
        token_id: Token ID
        new_tier: New subscription tier
        
    Returns:
        Success message
    """
    try:
        tier = SubscriptionTier(new_tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: free, pro, enterprise"
        )
    
    success = subscription_manager.upgrade_token(token_id, tier)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found"
        )
    
    return {"message": f"Token upgraded to {new_tier}"}


@router.get("/usage/{user_id}", response_model=UsageStatsResponse)
async def get_usage_stats(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _: str = Depends(verify_admin_token)
):
    """
    Get usage statistics for a user (admin only).
    
    Args:
        user_id: User identifier
        start_date: Optional start date (ISO format)
        end_date: Optional end date (ISO format)
        
    Returns:
        Usage statistics
    """
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    stats = subscription_manager.get_usage_stats(user_id, start, end)
    
    return UsageStatsResponse(**stats)


@router.get("/tiers", response_model=List[TierLimitsResponse])
async def get_tier_limits():
    """
    Get limits for all subscription tiers (public).
    
    Returns:
        List of tier limits
    """
    from ..backend.subscription_manager import TIER_LIMITS
    
    return [
        TierLimitsResponse(
            tier=tier.value,
            max_api_calls_per_day=limits.max_api_calls_per_day,
            max_api_calls_per_minute=limits.max_api_calls_per_minute,
            max_concurrent_strategies=limits.max_concurrent_strategies,
            max_positions=limits.max_positions,
            max_order_value_usd=limits.max_order_value_usd,
            can_use_advanced_strategies=limits.can_use_advanced_strategies,
            can_access_tick_data=limits.can_access_tick_data,
            can_use_multi_market=limits.can_use_multi_market,
            websocket_access=limits.websocket_access,
            priority_support=limits.priority_support,
            custom_indicators=limits.custom_indicators
        )
        for tier, limits in TIER_LIMITS.items()
    ]


@router.get("/tiers/{tier_name}", response_model=TierLimitsResponse)
async def get_tier_info(tier_name: str):
    """
    Get limits for a specific tier (public).
    
    Args:
        tier_name: Tier name (free, pro, or enterprise)
        
    Returns:
        Tier limits
    """
    try:
        tier = SubscriptionTier(tier_name)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: free, pro, enterprise"
        )
    
    limits = subscription_manager.get_tier_limits(tier)
    
    return TierLimitsResponse(
        tier=tier.value,
        max_api_calls_per_day=limits.max_api_calls_per_day,
        max_api_calls_per_minute=limits.max_api_calls_per_minute,
        max_concurrent_strategies=limits.max_concurrent_strategies,
        max_positions=limits.max_positions,
        max_order_value_usd=limits.max_order_value_usd,
        can_use_advanced_strategies=limits.can_use_advanced_strategies,
        can_access_tick_data=limits.can_access_tick_data,
        can_use_multi_market=limits.can_use_multi_market,
        websocket_access=limits.websocket_access,
        priority_support=limits.priority_support,
        custom_indicators=limits.custom_indicators
    )
