"""Database models package (safe re-export shim)."""

# Try to import Base if present
try:
    from backend.models.base import Base
except Exception:
    Base = None

# Initialize placeholders for optional exports
_Order = None
_engine = None
_SessionLocal = None
_get_db = None
_Subscription = None

# Try possible locations for Order
try:
    from backend.models.order import Order as _Order
except Exception:
    _Order = None

# Try common database modules: database.py then db.py
try:
    from backend.models.database import engine as _engine, SessionLocal as _SessionLocal, get_db as _get_db
except Exception:
    try:
        from backend.models.db import engine as _engine, SessionLocal as _SessionLocal, get_db as _get_db
    except Exception:
        _engine = None
        _SessionLocal = None
        _get_db = None

# Try subscription
try:
    from backend.models.subscription import Subscription as _Subscription
except Exception:
    _Subscription = None

# Expose names at module level (object or None)
Order = _Order
engine = _engine
SessionLocal = _SessionLocal
get_db = _get_db
Subscription = _Subscription

__all__ = ["Base", "Order", "engine", "SessionLocal", "get_db", "Subscription"]
