"""Order model placeholder for test compatibility."""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.models.base import Base


class Order(Base):
    """Order model - placeholder for trading orders."""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
