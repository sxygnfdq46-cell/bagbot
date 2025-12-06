"""SQLAlchemy models for bot settings, API keys, and audit log."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func

from backend.models.base import Base


class BotSettings(Base):
    """Key/value store for user or global bot settings."""

    __tablename__ = "bot_settings"

    id = Column(Integer, primary_key=True)
    owner_id = Column(String, index=True, nullable=False)
    key = Column(String, index=True, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ApiKeyEntry(Base):
    """Encrypted API key storage."""

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True)
    owner_id = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    encrypted_key = Column(Text, nullable=False)
    redacted = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class AuditLog(Base):
    """Audit trail for control and settings actions."""

    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    actor_id = Column(String, index=True, nullable=False)
    action = Column(String, index=True, nullable=False)
    detail = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
