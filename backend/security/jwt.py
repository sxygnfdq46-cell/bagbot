"""Minimal JWT utilities backed by HMAC-SHA256 (no external deps)."""
import base64
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from hmac import compare_digest, new as hmac_new
from hashlib import sha256

DEFAULT_SECRET = "local-development-secret"
SECRET_KEY = os.getenv("BAGBOT_JWT_SECRET", DEFAULT_SECRET).encode()
ACCESS_TOKEN_EXPIRE_MINUTES = 60
_JWT_HEADER = {"alg": "HS256", "typ": "JWT"}


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(message: bytes) -> str:
    signature = hmac_new(SECRET_KEY, message, sha256).digest()
    return _b64_encode(signature)


def create_access_token(user_claims: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT for the provided user claims."""

    expire_at = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user_claims.get("email"),
        "user": user_claims,
        "exp": int(expire_at.timestamp()),
    }
    header_segment = _b64_encode(json.dumps(_JWT_HEADER, separators=(",", ":"), sort_keys=True).encode())
    payload_segment = _b64_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    signing_input = f"{header_segment}.{payload_segment}".encode()
    signature_segment = _sign(signing_input)
    return f"{header_segment}.{payload_segment}.{signature_segment}"


class TokenError(Exception):
    """Raised when a token cannot be decoded."""


def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT and validate its signature/expiration."""

    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:  # pragma: no cover - invalid tokens rejected
        raise TokenError("Invalid token format") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode()
    expected_signature = _sign(signing_input)
    if not compare_digest(signature_segment, expected_signature):
        raise TokenError("Invalid token signature")

    payload_bytes = _b64_decode(payload_segment)
    payload = json.loads(payload_bytes)
    exp = payload.get("exp")
    if exp is not None and datetime.now(timezone.utc).timestamp() > exp:
        raise TokenError("Token expired")

    return payload


def validate_token(token: str) -> Dict[str, Any]:
    """Decode a JWT and raise TokenError when invalid."""

    return decode_token(token)
