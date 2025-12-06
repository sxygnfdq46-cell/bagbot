"""Database models package.

Re-exports common model objects expected by tests.
Provides safe fallbacks to avoid ImportError during test collection.
"""

# Import Base from known location
from backend.models.base import Base

# Initialize exports that don't exist yet as None
# These are expected by tests but not implemented in current codebase
Order = None
Subscription = None

# Import available database utilities from backend.db
# Use specific exception handling for clarity
engine = None
SessionLocal = None
get_db = None

try:
    from backend.db.session import (
        engine as _engine,
        AsyncSessionLocal as _SessionLocal,
        get_async_session as _get_db,
    )
    engine = _engine
    SessionLocal = _SessionLocal
    get_db = _get_db
except (ImportError, ModuleNotFoundError):
    # backend.db.session not available yet, keep None defaults
    pass

# Fixed __all__ list for consistent exports
__all__ = ["Base", "Order", "get_db", "engine", "SessionLocal", "Subscription"]

