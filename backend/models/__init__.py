k"""package marker + safe re-exports for CI tests"""

try:
    from .base import Base, SessionLocal, get_db
except Exception:
    Base = None
    SessionLocal = None
    get_db = None

__all__ = ["Base", "SessionLocal", "get_db"]
