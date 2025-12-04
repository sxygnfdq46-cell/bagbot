"""Password hashing helpers built on the stdlib (PBKDF2 + SHA256)."""
import base64
import os
from hashlib import pbkdf2_hmac
from hmac import compare_digest

_ITERATIONS = 100_000
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    """Return a salted PBKDF2 hash encoded for storage."""

    salt = os.urandom(_SALT_BYTES)
    digest = pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return base64.b64encode(salt + digest).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""

    raw = base64.b64decode(hashed_password.encode())
    salt, stored_digest = raw[:_SALT_BYTES], raw[_SALT_BYTES:]
    candidate = pbkdf2_hmac("sha256", plain_password.encode(), salt, _ITERATIONS)
    return compare_digest(candidate, stored_digest)
