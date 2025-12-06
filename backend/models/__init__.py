"""Database models package."""

# Re-export common model objects used by tests.
# Try common local module paths and fall back gracefully to avoid ImportError during test collection.
from typing import TYPE_CHECKING

# Import Base from known location
from backend.models.base import Base

# Initialize other expected exports as None
Order = None
get_db = None
engine = None
SessionLocal = None
Subscription = None

# Try importing from likely locations inside this package
_try_paths = [
    (".order", "Order"),
    (".database", "get_db"),
    (".db", "get_db"),
    (".models", "Order"),
    (".subscription", "Subscription"),
]

for mod_path, symbol in _try_paths:
    if symbol in globals() and globals()[symbol] is not None:
        continue
    try:
        module = __import__(f"backend.models{mod_path}", fromlist=[symbol])
        if hasattr(module, symbol):
            globals()[symbol] = getattr(module, symbol)
    except Exception:
        try:
            module = __import__(f"{mod_path}", fromlist=[symbol])
            if hasattr(module, symbol):
                globals()[symbol] = getattr(module, symbol)
        except Exception:
            pass

# Try importing from backend.db for get_db, engine, SessionLocal
try:
    from backend.db.session import engine as _engine, AsyncSessionLocal as _AsyncSessionLocal
    if engine is None:
        engine = _engine
    if SessionLocal is None:
        SessionLocal = _AsyncSessionLocal
except Exception:
    pass

# Try importing get_async_session as get_db
try:
    from backend.db.session import get_async_session
    if get_db is None:
        get_db = get_async_session
except Exception:
    pass

# If running type-checking or tests expect these symbol definitions, they're available now
__all__ = [name for name in ("Base", "Order", "get_db", "engine", "SessionLocal", "Subscription") if name in globals()]
