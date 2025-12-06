# Re-export common model objects expected by tests
# Explicit imports from concrete modules to satisfy tests that import from backend.models
try:
    from .order import Order
except Exception:
    Order = None

try:
    from .database import Base, get_db
except Exception:
    Base = None
    get_db = None

# If Base wasn't imported from database, try from base.py
if Base is None:
    try:
        from .base import Base
    except Exception:
        Base = None

__all__ = ["Base", "Order", "get_db"]
