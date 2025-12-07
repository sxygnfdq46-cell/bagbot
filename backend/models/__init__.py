"""Database models package and re-exports.

This module ensures the names tests import from `backend.models` are re-exported
if they are defined in plausible backend modules. This performs dynamic imports
only for symbol discovery and does not change business logic.
"""

from importlib import import_module
from .base import Base
from .db_models import Subscription

__all__ = ["Base", "Subscription"]

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
    except Exception:
        continue
    for _sym in ("engine", "SessionLocal", "AsyncSessionLocal"):
        if hasattr(_mod, _sym):
            # Map AsyncSessionLocal to SessionLocal for backward compatibility
            if _sym == "AsyncSessionLocal" and "SessionLocal" not in globals():
                globals()["SessionLocal"] = getattr(_mod, _sym)
                if "SessionLocal" not in __all__:
                    __all__.append("SessionLocal")
            else:
                globals()[_sym] = getattr(_mod, _sym)
                if _sym not in __all__:
                    __all__.append(_sym)
