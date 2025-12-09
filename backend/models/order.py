"""Order model placeholder for test compatibility."""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.models.base import Base


class Order(Base):
    """Order model matching test expectations."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    symbol = Column(String, nullable=False)
    qty = Column(Float, nullable=False)
    price = Column(Float, nullable=True)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    status = Column(String, default="pending", nullable=False)
    external_id = Column(String, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
