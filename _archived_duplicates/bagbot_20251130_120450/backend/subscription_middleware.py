"""
Subscription Authentication Middleware

Validates API tokens and enforces rate limits.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import logging
import time

from .subscription_manager import SubscriptionManager, TokenStatus

logger = logging.getLogger(__name__)


class SubscriptionAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to authenticate and rate limit API requests based on subscription tier.
    """
    
    # Paths that don't require authentication
    PUBLIC_PATHS = [
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/subscription/tiers",
        "/health",
        "/api/health"
    ]
    
    def __init__(self, app, subscription_manager: SubscriptionManager):
        """Initialize middleware."""
        super().__init__(app)
        self.subscription_manager = subscription_manager
        logger.info("🔐 SubscriptionAuthMiddleware initialized")
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate token."""
        # Skip authentication for public paths
        if self._is_public_path(request.url.path):
            return await call_next(request)
        
        # Skip authentication for admin endpoints (they have their own auth)
        if request.url.path.startswith("/api/admin"):
            return await call_next(request)
        
        # Extract token from header
        authorization = request.headers.get("Authorization")
        
        if not authorization:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "API token required. Include 'Authorization: Bearer <token>' header."
                }
            )
        
        if not authorization.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid authorization format. Use 'Bearer <token>'"}
            )
        
        token_string = authorization.replace("Bearer ", "")
        
        # Validate token
        token = self.subscription_manager.validate_token(token_string)
        
        if token is None:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired token"}
            )
        
        # Check rate limits
        is_allowed, reason = self.subscription_manager.check_rate_limit(token)
        
        if not is_allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: {reason}",
                    "tier": token.tier,
                    "daily_limit": token.daily_call_limit,
                    "calls_today": token.api_calls_today
                }
            )
        
        # Attach token to request state
        request.state.token = token
        request.state.user_id = token.user_id
        request.state.tier = token.tier
        
        # Process request and measure response time
        start_time = time.time()
        
        try:
            response = await call_next(request)
            response_time_ms = (time.time() - start_time) * 1000
            
            # Record API call
            self.subscription_manager.record_api_call(
                token=token,
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                metadata={
                    "query_params": str(request.query_params),
                    "ip": request.client.host if request.client else None
                }
            )
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(token.daily_call_limit)
            response.headers["X-RateLimit-Remaining"] = str(
                token.daily_call_limit - token.api_calls_today
            )
            response.headers["X-RateLimit-Tier"] = token.tier
            
            return response
        
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            raise
    
    def _is_public_path(self, path: str) -> bool:
        """Check if path is public."""
        for public_path in self.PUBLIC_PATHS:
            if path == public_path or path.startswith(public_path):
                return True
        return False
