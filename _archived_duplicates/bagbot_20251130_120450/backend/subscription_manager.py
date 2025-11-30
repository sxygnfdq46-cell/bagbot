"""
Subscription & Payment Framework

Tier system with API token management:
- Free: Basic access, limited features
- Pro: Full features, higher limits
- Enterprise: Unlimited, priority support

Features:
- API token generation and validation
- Usage tracking and limits
- Expiry management
- Admin override capabilities
"""

import os
import secrets
import hashlib
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
import json

from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)

Base = declarative_base()


class SubscriptionTier(Enum):
    """Subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class TokenStatus(Enum):
    """API token status."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    REVOKED = "revoked"


@dataclass
class TierLimits:
    """Limits for each subscription tier."""
    tier: SubscriptionTier
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


# Tier definitions
TIER_LIMITS = {
    SubscriptionTier.FREE: TierLimits(
        tier=SubscriptionTier.FREE,
        max_api_calls_per_day=1000,
        max_api_calls_per_minute=10,
        max_concurrent_strategies=1,
        max_positions=3,
        max_order_value_usd=100.0,
        can_use_advanced_strategies=False,
        can_access_tick_data=False,
        can_use_multi_market=False,
        websocket_access=False,
        priority_support=False,
        custom_indicators=False
    ),
    SubscriptionTier.PRO: TierLimits(
        tier=SubscriptionTier.PRO,
        max_api_calls_per_day=50000,
        max_api_calls_per_minute=100,
        max_concurrent_strategies=5,
        max_positions=20,
        max_order_value_usd=10000.0,
        can_use_advanced_strategies=True,
        can_access_tick_data=True,
        can_use_multi_market=True,
        websocket_access=True,
        priority_support=False,
        custom_indicators=True
    ),
    SubscriptionTier.ENTERPRISE: TierLimits(
        tier=SubscriptionTier.ENTERPRISE,
        max_api_calls_per_day=-1,  # Unlimited
        max_api_calls_per_minute=1000,
        max_concurrent_strategies=-1,  # Unlimited
        max_positions=-1,  # Unlimited
        max_order_value_usd=-1,  # Unlimited
        can_use_advanced_strategies=True,
        can_access_tick_data=True,
        can_use_multi_market=True,
        websocket_access=True,
        priority_support=True,
        custom_indicators=True
    )
}


class APIToken(Base):
    """API Token model."""
    __tablename__ = "api_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    token_prefix = Column(String, index=True)  # First 8 chars for identification
    name = Column(String)  # User-friendly name
    tier = Column(String, nullable=False)  # Subscription tier
    status = Column(String, default="active")
    
    # Usage tracking
    total_api_calls = Column(Integer, default=0)
    api_calls_today = Column(Integer, default=0)
    last_used = Column(DateTime)
    
    # Limits
    daily_call_limit = Column(Integer)
    minute_call_limit = Column(Integer)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    last_reset = Column(DateTime, default=datetime.utcnow)
    
    # Admin overrides
    is_admin_override = Column(Boolean, default=False)
    override_reason = Column(String)
    
    def is_expired(self) -> bool:
        """Check if token is expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if token is valid."""
        return (
            self.status == TokenStatus.ACTIVE.value and
            not self.is_expired()
        )


class UsageLog(Base):
    """Usage log for tracking API calls."""
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    response_time_ms = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    meta_data = Column(String)  # JSON string - renamed from metadata to avoid SQLAlchemy conflict


class SubscriptionManager:
    """
    Manages subscriptions, API tokens, and usage limits.
    """
    
    def __init__(self, db_url: Optional[str] = None):
        """Initialize subscription manager."""
        if db_url is None:
            db_url = os.getenv("DATABASE_URL", "sqlite:///./bagbot.db")
        
        self.engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
        )
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        logger.info("💳 SubscriptionManager initialized")
    
    def create_token(
        self,
        user_id: str,
        tier: SubscriptionTier,
        name: Optional[str] = None,
        expires_in_days: Optional[int] = None
    ) -> tuple[str, APIToken]:
        """
        Create a new API token.
        
        Args:
            user_id: User identifier
            tier: Subscription tier
            name: Optional token name
            expires_in_days: Days until expiration (None = never)
            
        Returns:
            Tuple of (token_string, token_object)
        """
        # Generate secure token
        token = self._generate_token()
        token_hash = self._hash_token(token)
        token_prefix = token[:8]
        
        # Get tier limits
        limits = TIER_LIMITS[tier]
        
        # Calculate expiry
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create database entry
        db = self.SessionLocal()
        try:
            db_token = APIToken(
                user_id=user_id,
                token_hash=token_hash,
                token_prefix=token_prefix,
                name=name or f"Token for {user_id}",
                tier=tier.value,
                status=TokenStatus.ACTIVE.value,
                daily_call_limit=limits.max_api_calls_per_day,
                minute_call_limit=limits.max_api_calls_per_minute,
                expires_at=expires_at
            )
            
            db.add(db_token)
            db.commit()
            db.refresh(db_token)
            
            # Detach from session to avoid DetachedInstanceError
            db.expunge(db_token)
            
            logger.info(f"🔑 Created {tier.value} token for user {user_id}")
            
            return token, db_token
        
        finally:
            db.close()
    
    def validate_token(self, token: str) -> Optional[APIToken]:
        """
        Validate an API token.
        
        Args:
            token: Token string
            
        Returns:
            APIToken object if valid, None otherwise
        """
        token_hash = self._hash_token(token)
        
        db = self.SessionLocal()
        try:
            db_token = db.query(APIToken).filter(
                APIToken.token_hash == token_hash
            ).first()
            
            if db_token is None:
                return None
            
            # Check if valid
            if not db_token.is_valid():
                logger.warning(f"Invalid token attempt: {db_token.token_prefix}")
                return None
            
            # Reset daily counter if needed
            now = datetime.utcnow()
            if db_token.last_reset.date() < now.date():
                db_token.api_calls_today = 0
                db_token.last_reset = now
            
            # Update last used
            db_token.last_used = now
            db.commit()
            db.refresh(db_token)  # Refresh to load all attributes
            
            # Detach from session to avoid DetachedInstanceError
            db.expunge(db_token)
            
            return db_token
        
        finally:
            db.close()
    
    def record_api_call(
        self,
        token: APIToken,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Record an API call and check limits.
        
        Args:
            token: API token
            endpoint: API endpoint
            method: HTTP method
            status_code: Response status code
            response_time_ms: Response time in milliseconds
            metadata: Optional metadata
            
        Returns:
            True if call was recorded, False if limit exceeded
        """
        db = self.SessionLocal()
        try:
            # Merge the token back into this session if it's detached
            if not db.object_session(token):
                token = db.merge(token)
            
            # Check daily limit
            if token.daily_call_limit > 0:
                if token.api_calls_today >= token.daily_call_limit:
                    logger.warning(
                        f"Daily limit exceeded for token {token.token_prefix}"
                    )
                    return False
            
            # Increment counters
            token.total_api_calls += 1
            token.api_calls_today += 1
            
            # Log usage
            usage_log = UsageLog(
                token_id=token.id,
                user_id=token.user_id,
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                response_time_ms=response_time_ms,
                metadata=json.dumps(metadata) if metadata else None
            )
            
            db.add(usage_log)
            db.commit()
            
            return True
        
        finally:
            db.close()
    
    def check_rate_limit(self, token: APIToken) -> tuple[bool, str]:
        """
        Check if token has exceeded rate limits.
        
        Args:
            token: API token
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        # Admin override always allowed
        if token.is_admin_override:
            return True, "Admin override"
        
        # Check daily limit
        if token.daily_call_limit > 0:
            if token.api_calls_today >= token.daily_call_limit:
                return False, f"Daily limit exceeded ({token.daily_call_limit})"
        
        # TODO: Check minute limit (requires Redis or similar)
        
        return True, "OK"
    
    def get_tier_limits(self, tier: SubscriptionTier) -> TierLimits:
        """Get limits for a subscription tier."""
        return TIER_LIMITS[tier]
    
    def upgrade_token(self, token_id: int, new_tier: SubscriptionTier) -> bool:
        """
        Upgrade a token to a new tier.
        
        Args:
            token_id: Token ID
            new_tier: New subscription tier
            
        Returns:
            True if successful
        """
        db = self.SessionLocal()
        try:
            token = db.query(APIToken).filter(APIToken.id == token_id).first()
            
            if token is None:
                return False
            
            # Update tier and limits
            limits = TIER_LIMITS[new_tier]
            token.tier = new_tier.value
            token.daily_call_limit = limits.max_api_calls_per_day
            token.minute_call_limit = limits.max_api_calls_per_minute
            
            db.commit()
            
            logger.info(
                f"⬆️  Token {token.token_prefix} upgraded to {new_tier.value}"
            )
            
            return True
        
        finally:
            db.close()
    
    def revoke_token(self, token_id: int, reason: str = "") -> bool:
        """
        Revoke an API token.
        
        Args:
            token_id: Token ID
            reason: Reason for revocation
            
        Returns:
            True if successful
        """
        db = self.SessionLocal()
        try:
            token = db.query(APIToken).filter(APIToken.id == token_id).first()
            
            if token is None:
                return False
            
            token.status = TokenStatus.REVOKED.value
            token.override_reason = reason
            
            db.commit()
            
            logger.info(f"🚫 Token {token.token_prefix} revoked: {reason}")
            
            return True
        
        finally:
            db.close()
    
    def get_user_tokens(self, user_id: str) -> List[APIToken]:
        """Get all tokens for a user."""
        db = self.SessionLocal()
        try:
            return db.query(APIToken).filter(
                APIToken.user_id == user_id
            ).all()
        finally:
            db.close()
    
    def get_usage_stats(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get usage statistics for a user.
        
        Args:
            user_id: User ID
            start_date: Start date for stats
            end_date: End date for stats
            
        Returns:
            Dictionary with usage statistics
        """
        db = self.SessionLocal()
        try:
            query = db.query(UsageLog).filter(UsageLog.user_id == user_id)
            
            if start_date:
                query = query.filter(UsageLog.timestamp >= start_date)
            if end_date:
                query = query.filter(UsageLog.timestamp <= end_date)
            
            logs = query.all()
            
            if not logs:
                return {
                    "total_calls": 0,
                    "avg_response_time_ms": 0,
                    "endpoints": {}
                }
            
            # Calculate stats
            total_calls = len(logs)
            avg_response_time = sum(log.response_time_ms for log in logs) / total_calls
            
            # Group by endpoint
            endpoints = {}
            for log in logs:
                if log.endpoint not in endpoints:
                    endpoints[log.endpoint] = 0
                endpoints[log.endpoint] += 1
            
            return {
                "total_calls": total_calls,
                "avg_response_time_ms": avg_response_time,
                "endpoints": endpoints,
                "period": {
                    "start": start_date.isoformat() if start_date else None,
                    "end": end_date.isoformat() if end_date else None
                }
            }
        
        finally:
            db.close()
    
    def _generate_token(self) -> str:
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    def _hash_token(self, token: str) -> str:
        """Hash a token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()
