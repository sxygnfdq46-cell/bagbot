"""backend.models package exports used by tests."""
__all__ = []

# Try to import Order, Base, get_db from commonly named modules.
# These imports use try/except to handle cases where modules or attributes don't exist yet.
try:
    from .order import Order
    __all__.append("Order")
except (ImportError, ModuleNotFoundError, AttributeError):
    # Best-effort fallback; ImportError will be raised only when the symbol is actually requested
    pass

try:
    from .base import Base, get_db
    __all__.extend(["Base", "get_db"])
except (ImportError, ModuleNotFoundError, AttributeError):
    # Try importing Base alone if get_db doesn't exist
    try:
        from .base import Base
        if "Base" not in __all__:
            __all__.append("Base")
    except (ImportError, ModuleNotFoundError, AttributeError):
        pass
