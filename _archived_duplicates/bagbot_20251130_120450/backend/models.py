"""
Database models for Bagbot application
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, create_engine, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import enum

Base = declarative_base()

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bagbot.db")

# Debug: Print DATABASE_URL info (without credentials)
if "postgresql://" in DATABASE_URL or "postgres://" in DATABASE_URL:
    # Extract host for debugging (safely)
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        print(f"[DB] PostgreSQL detected - Host: {parsed.hostname}, Port: {parsed.port}, Database: {parsed.path[1:]}")
    except Exception as e:
        print(f"[DB] Could not parse DATABASE_URL: {e}")

# Fix postgres:// to postgresql:// for SQLAlchemy 2.0+
# Render provides postgres:// but SQLAlchemy 2.0+ requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    print(f"[DB] Converting postgres:// to postgresql:// for SQLAlchemy 2.0+ compatibility")
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print(f"[DB] Database URL converted successfully")

# Check for invalid placeholder hostname
if "hostname" in DATABASE_URL and "postgresql" in DATABASE_URL:
    print("[DB] WARNING: DATABASE_URL contains placeholder 'hostname' - falling back to SQLite")
    print("[DB] Please configure a proper PostgreSQL database in Render dashboard")
    DATABASE_URL = "sqlite:///./bagbot.db"

print(f"[DB] Using database: {'PostgreSQL' if 'postgresql' in DATABASE_URL else 'SQLite'}")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True  # Verify connections before using them
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class OrderSourceEnum(enum.Enum):
    """Order source types"""
    MANUAL = "manual"
    TRADINGVIEW = "tradingview"
    STRATEGY = "strategy"
    API = "api"


class OrderStatusEnum(enum.Enum):
    """Order status types"""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELED = "canceled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Subscription(Base):
    """
    Subscription model for tracking user subscriptions via Stripe
    """
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    stripe_customer_id = Column(String, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, nullable=False)  # 'basic', 'pro', 'enterprise'
    status = Column(String, nullable=False)  # 'active', 'past_due', 'canceled', 'incomplete'
    current_period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Subscription(user_id={self.user_id}, plan={self.plan}, status={self.status})>"

    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return self.status in ['active', 'trialing'] and self.current_period_end > datetime.utcnow()


class Order(Base):
    """
    Order model for tracking all trading orders
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    symbol = Column(String, nullable=False, index=True)
    qty = Column(Float, nullable=False)  # Order quantity
    price = Column(Float)  # Limit price (null for market orders)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    status = Column(String, default="pending", nullable=False)  # 'pending', 'open', 'filled', 'canceled', 'rejected'
    external_id = Column(String, index=True)  # Order ID from exchange
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Order(id={self.id}, symbol={self.symbol}, side={self.side}, qty={self.qty}, status={self.status})>"


class TradingOrder(Base):
    """
    Extended trading order model for tracking all orders with additional fields
    (Deprecated: Use Order model for new implementations)
    """
    __tablename__ = "trading_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    exchange = Column(String, nullable=False)  # 'binance', 'coinbase', etc.
    exchange_order_id = Column(String, index=True)  # Order ID from exchange
    client_order_id = Column(String, unique=True, index=True)  # Our internal order ID
    
    symbol = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)  # 'buy', 'sell'
    order_type = Column(String, nullable=False)  # 'market', 'limit', 'stop_loss'
    quantity = Column(Float, nullable=False)
    price = Column(Float)  # Limit price (null for market orders)
    stop_price = Column(Float)  # Stop price for stop orders
    
    status = Column(SQLEnum(OrderStatusEnum), default=OrderStatusEnum.PENDING, nullable=False)
    filled_quantity = Column(Float, default=0.0)
    remaining_quantity = Column(Float)
    average_fill_price = Column(Float)
    
    source = Column(SQLEnum(OrderSourceEnum), default=OrderSourceEnum.MANUAL, nullable=False)
    source_signal_id = Column(String)  # TradingView alert ID or strategy ID
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    filled_at = Column(DateTime)
    
    # Risk management fields
    risk_check_passed = Column(String, default="pending")  # 'pending', 'passed', 'failed'
    risk_check_reason = Column(String)
    
    # Additional metadata (renamed from 'metadata' to avoid SQLAlchemy reserved word)
    order_metadata = Column(String)  # JSON string for additional data

    def __repr__(self):
        return f"<TradingOrder(id={self.id}, symbol={self.symbol}, side={self.side}, status={self.status})>"
    
    def is_terminal_state(self) -> bool:
        """Check if order is in a terminal state"""
        return self.status in [
            OrderStatusEnum.FILLED,
            OrderStatusEnum.CANCELED,
            OrderStatusEnum.REJECTED,
            OrderStatusEnum.EXPIRED
        ]


# Create all tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


# Dependency to get DB session
def get_db():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
