"""Database model placeholders."""
from __future__ import annotations

from typing import Any
from sqlalchemy import Column, Integer, String, DateTime
from .base import Base


class BaseDBModel:
    """TODO: replace with SQLAlchemy declarative base."""

    id: Any


class Subscription(Base):
    """Placeholder Subscription model for test compatibility."""
    
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False)
    plan = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
