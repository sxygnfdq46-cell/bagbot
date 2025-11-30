"""
Tests for Subscription Manager
"""

import pytest
from datetime import datetime, timedelta
from bagbot.backend.subscription_manager import (
    SubscriptionManager,
    SubscriptionTier,
    TokenStatus,
    APIToken,
    TIER_LIMITS
)


@pytest.fixture
def manager():
    """Create subscription manager with test database."""
    return SubscriptionManager(db_url="sqlite:///:memory:")


def test_create_free_token(manager):
    """Test creating a free tier token."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE,
        name="Test Token"
    )
    
    assert len(token_string) > 0
    assert token.user_id == "test_user"
    assert token.tier == "free"
    assert token.daily_call_limit == 1000


def test_create_pro_token(manager):
    """Test creating a pro tier token."""
    token_string, token = manager.create_token(
        user_id="pro_user",
        tier=SubscriptionTier.PRO,
        name="Pro Token"
    )
    
    assert token.tier == "pro"
    assert token.daily_call_limit == 50000


def test_create_enterprise_token(manager):
    """Test creating an enterprise tier token."""
    token_string, token = manager.create_token(
        user_id="enterprise_user",
        tier=SubscriptionTier.ENTERPRISE,
        name="Enterprise Token"
    )
    
    assert token.tier == "enterprise"
    assert token.daily_call_limit == -1  # Unlimited


def test_create_token_with_expiry(manager):
    """Test creating a token with expiry."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE,
        expires_in_days=30
    )
    
    assert token.expires_at is not None
    expected_expiry = datetime.utcnow() + timedelta(days=30)
    assert token.expires_at.date() == expected_expiry.date()


def test_validate_token(manager):
    """Test token validation."""
    # Create token
    token_string, created_token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Validate
    validated_token = manager.validate_token(token_string)
    
    assert validated_token is not None
    assert validated_token.id == created_token.id
    assert validated_token.user_id == "test_user"


def test_validate_invalid_token(manager):
    """Test validation of invalid token."""
    validated_token = manager.validate_token("invalid_token_string")
    
    assert validated_token is None


def test_validate_expired_token(manager):
    """Test validation of expired token."""
    # Create token that expires immediately
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE,
        expires_in_days=-1  # Already expired
    )
    
    validated_token = manager.validate_token(token_string)
    
    assert validated_token is None


def test_check_rate_limit_free(manager):
    """Test rate limit checking for free tier."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Should be allowed initially
    is_allowed, reason = manager.check_rate_limit(token)
    assert is_allowed is True
    
    # Exceed daily limit
    token.api_calls_today = token.daily_call_limit
    is_allowed, reason = manager.check_rate_limit(token)
    assert is_allowed is False
    assert "exceeded" in reason.lower()


def test_check_rate_limit_enterprise(manager):
    """Test rate limit for enterprise (unlimited)."""
    token_string, token = manager.create_token(
        user_id="enterprise_user",
        tier=SubscriptionTier.ENTERPRISE
    )
    
    # Set high usage
    token.api_calls_today = 1000000
    
    # Should still be allowed (unlimited)
    is_allowed, reason = manager.check_rate_limit(token)
    assert is_allowed is True


def test_record_api_call(manager):
    """Test recording API call."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Record call
    success = manager.record_api_call(
        token=token,
        endpoint="/api/test",
        method="GET",
        status_code=200,
        response_time_ms=50.0
    )
    
    assert success is True
    
    # Verify counter incremented
    validated = manager.validate_token(token_string)
    assert validated.api_calls_today == 1
    assert validated.total_api_calls == 1


def test_record_api_call_limit_exceeded(manager):
    """Test recording API call when limit exceeded."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Set to limit
    token.api_calls_today = token.daily_call_limit
    
    # Try to record
    success = manager.record_api_call(
        token=token,
        endpoint="/api/test",
        method="GET",
        status_code=200,
        response_time_ms=50.0
    )
    
    assert success is False


def test_upgrade_token(manager):
    """Test upgrading a token tier."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Upgrade to pro
    success = manager.upgrade_token(token.id, SubscriptionTier.PRO)
    
    assert success is True
    
    # Verify upgrade
    validated = manager.validate_token(token_string)
    assert validated.tier == "pro"
    assert validated.daily_call_limit == 50000


def test_revoke_token(manager):
    """Test revoking a token."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Revoke
    success = manager.revoke_token(token.id, "Test revocation")
    
    assert success is True
    
    # Verify revoked
    validated = manager.validate_token(token_string)
    assert validated is None


def test_get_user_tokens(manager):
    """Test getting all tokens for a user."""
    # Create multiple tokens
    manager.create_token("user1", SubscriptionTier.FREE, "Token 1")
    manager.create_token("user1", SubscriptionTier.PRO, "Token 2")
    manager.create_token("user2", SubscriptionTier.FREE, "Token 3")
    
    # Get user1 tokens
    tokens = manager.get_user_tokens("user1")
    
    assert len(tokens) == 2
    assert all(t.user_id == "user1" for t in tokens)


def test_get_usage_stats(manager):
    """Test getting usage statistics."""
    token_string, token = manager.create_token(
        user_id="test_user",
        tier=SubscriptionTier.FREE
    )
    
    # Record some calls
    for i in range(5):
        manager.record_api_call(
            token=token,
            endpoint=f"/api/endpoint{i % 2}",
            method="GET",
            status_code=200,
            response_time_ms=50.0 + i
        )
    
    # Get stats
    stats = manager.get_usage_stats("test_user")
    
    assert stats["total_calls"] == 5
    assert len(stats["endpoints"]) == 2


def test_tier_limits():
    """Test tier limits configuration."""
    free_limits = TIER_LIMITS[SubscriptionTier.FREE]
    assert free_limits.max_api_calls_per_day == 1000
    assert free_limits.can_access_tick_data is False
    
    pro_limits = TIER_LIMITS[SubscriptionTier.PRO]
    assert pro_limits.max_api_calls_per_day == 50000
    assert pro_limits.can_access_tick_data is True
    
    enterprise_limits = TIER_LIMITS[SubscriptionTier.ENTERPRISE]
    assert enterprise_limits.max_api_calls_per_day == -1  # Unlimited


def test_get_tier_limits(manager):
    """Test getting tier limits."""
    limits = manager.get_tier_limits(SubscriptionTier.PRO)
    
    assert limits.tier == SubscriptionTier.PRO
    assert limits.max_api_calls_per_day == 50000
    assert limits.can_use_advanced_strategies is True


def test_admin_override(manager):
    """Test admin override."""
    token_string, token = manager.create_token(
        user_id="admin_user",
        tier=SubscriptionTier.FREE
    )
    
    # Set admin override
    token.is_admin_override = True
    token.api_calls_today = 10000  # Way over limit
    
    # Check rate limit - should be allowed
    is_allowed, reason = manager.check_rate_limit(token)
    assert is_allowed is True
    assert "override" in reason.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
