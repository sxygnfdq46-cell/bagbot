"""FastAPI dependencies for JWT-protected routes."""
from typing import Optional

from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.schemas.auth import UserProfile
from backend.security.jwt import TokenError, validate_token

_bearer_scheme = HTTPBearer(auto_error=False)
_WS_UNAUTHORIZED_CODE = 4401


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> UserProfile:
    """Decode the bearer token header and yield the authenticated user."""

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")

    try:
        payload = validate_token(credentials.credentials)
    except TokenError as exc:  # pragma: no cover - FastAPI handles response
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_data = payload.get("user")
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return UserProfile(**user_data)


async def require_admin(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Ensure the user has an admin role."""

    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return user


def _extract_ws_token(websocket: WebSocket) -> Optional[str]:
    token = websocket.query_params.get("token")
    if token:
        return token
    auth_header = websocket.headers.get("Authorization")
    if auth_header:
        scheme, _, value = auth_header.partition(" ")
        if scheme.lower() == "bearer" and value:
            return value
    return None


async def get_current_user_ws(websocket: WebSocket) -> UserProfile:
    """Authenticate a WebSocket handshake using JWT bearer tokens."""

    token = _extract_ws_token(websocket)
    if not token:
        raise WebSocketException(code=_WS_UNAUTHORIZED_CODE, reason="Missing credentials")

    try:
        payload = validate_token(token)
    except TokenError as exc:
        raise WebSocketException(code=_WS_UNAUTHORIZED_CODE, reason=str(exc)) from exc

    user_data = payload.get("user")
    if not user_data:
        raise WebSocketException(code=_WS_UNAUTHORIZED_CODE, reason="Invalid token payload")

    return UserProfile(**user_data)
