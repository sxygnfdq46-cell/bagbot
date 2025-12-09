"""Subscription model placeholder for test compatibility."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from backend.models.base import Base


class Subscription(Base):
    """Subscription model aligned with payment tests."""

    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")
    current_period_end = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def is_active(self) -> bool:
        """Return True when subscription is active or trialing and not expired."""

        if self.status not in {"active", "trialing"}:
            return False
        if not self.current_period_end:
            return True
        return self.current_period_end > datetime.utcnow()
