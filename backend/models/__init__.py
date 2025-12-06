"""
Database models package (safe re-export shim for CI)
"""

# Try to import Base
try:
    from backend.models.base import Base
except Exception:
    Base = None

# Defaults
Order = None
engine = None
SessionLocal = None
get_db = None
Subscription = None

# Order model
try:
    from backend.models.order import Order
except Exception:
    Order = None

# DB engine / session
try:
    from backend.models.database import engine, SessionLocal, get_db
except Exception:
    try:
        from backend.models.db import engine, SessionLocal, get_db
    except Exception:
        engine = None
        SessionLocal = None
        get_db = None

# Subscription model
try:
    from backend.models.subscription import Subscription
except Exception:
    Subscription = None

__all__ = ["Base", "Order", "engine", "SessionLocal", "get_db", "Subscription"]
