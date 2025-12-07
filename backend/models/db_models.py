"""Database model placeholders."""
from __future__ import annotations

from typing import Any
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
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


class Order(Base):
    """Placeholder Order model for test compatibility."""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    order_type = Column(String, nullable=False)  # 'market', 'limit', etc.
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=True)
    status = Column(String, nullable=False)
    filled = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
