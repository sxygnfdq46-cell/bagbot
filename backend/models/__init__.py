"""Database models package and re-exports.

This module ensures the names tests import from `backend.models` are re-exported
if they are defined in plausible backend modules. This performs dynamic imports
only for symbol discovery and does not change business logic.
"""

from importlib import import_module
from .base import Base
from .db_models import Subscription, Order

__all__ = ["Base", "Subscription", "Order"]

# Candidate modules where engine/SessionLocal/Subscription might be defined.
_CANDIDATE_MODULES = (
    "backend.models.database",
    "backend.models.db",
    "backend.models.session",
    "backend.models.engine",
    "backend.database",
    "backend.db",
    "backend.session",
)

for _mod_name in _CANDIDATE_MODULES:
    try:
        _mod = import_module(_mod_name)
    except (ModuleNotFoundError, ImportError):
        continue
    for _sym in ("engine", "SessionLocal", "AsyncSessionLocal", "get_db", "get_async_session"):
        if hasattr(_mod, _sym):
            # Map AsyncSessionLocal to SessionLocal for backward compatibility
            if _sym == "AsyncSessionLocal" and "SessionLocal" not in globals():
                globals()["SessionLocal"] = getattr(_mod, _sym)
                if "SessionLocal" not in __all__:
                    __all__.append("SessionLocal")
            # Map get_async_session to get_db for backward compatibility
            elif _sym == "get_async_session" and "get_db" not in globals():
                globals()["get_db"] = getattr(_mod, _sym)
                if "get_db" not in __all__:
                    __all__.append("get_db")
            else:
                globals()[_sym] = getattr(_mod, _sym)
                if _sym not in __all__:
                    __all__.append(_sym)
