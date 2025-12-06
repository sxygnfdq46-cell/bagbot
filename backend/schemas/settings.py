"""Pydantic schemas for settings, preferences, and API keys."""
from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, SecretStr


class PreferencesIn(BaseModel):
    """Incoming preferences payload."""

    notify_on_failure: Optional[bool] = True
    max_worker_count: Optional[int] = 1


class PreferencesOut(BaseModel):
    """Persisted preferences returned to clients."""

    notify_on_failure: bool
    max_worker_count: int


class ApiKeyIn(BaseModel):
    """Incoming API key payload."""

    name: str
    key: SecretStr


class ApiKeyOut(BaseModel):
    """API key response with redacted secret."""

    id: int
    name: str
    key_redacted: str = Field(..., description="Redacted key (e.g. ******abcd)")
    created_at: Optional[Any] = None


class AuditEntry(BaseModel):
    """Audit log entry shape."""

    id: int
    actor_id: str
    action: str
    detail: Optional[Dict[str, Any]] = None
    created_at: Any
