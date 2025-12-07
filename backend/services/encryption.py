"""Minimal encryption helper built on Fernet."""
from __future__ import annotations

import os
from typing import Optional

from cryptography.fernet import Fernet

_DEFAULT_KEY = os.getenv("BAGBOT_ENCRYPTION_KEY")
if _DEFAULT_KEY is None:
    # Fallback for local/dev to avoid crashes; should be overridden in env.
    _DEFAULT_KEY = Fernet.generate_key().decode()

fernet = Fernet(_DEFAULT_KEY.encode())


def encrypt_text(plain: str) -> str:
    """Encrypt a string with Fernet."""

    return fernet.encrypt(plain.encode()).decode()


def decrypt_text(token: str) -> str:
    """Decrypt a Fernet token string."""

    return fernet.decrypt(token.encode()).decode()


def redact_key(secret: str) -> str:
    """Return a redacted mask (****** + last4)."""

    if not secret:
        return ""
    tail = secret[-4:]
    return "******" + tail
