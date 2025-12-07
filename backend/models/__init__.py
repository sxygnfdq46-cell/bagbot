"""
backend.models - safe re-export layer for CI tests
"""

from .base import Base
__all__ = ["Base"]

try:
    from .order import Order
except Exception:
    Order = None
else:
    __all__.append("Order")

try:
    from .db import engine, SessionLocal
except Exception:
    engine = None
    SessionLocal = None
else:
    __all__.extend(["engine", "SessionLocal"])

try:
    from .subscription import Subscription
except Exception:
    Subscription = None
else:
    __all__.append("Subscription")
