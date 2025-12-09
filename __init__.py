# BagBot Trading Platform
__version__ = "1.0.0"

import sys
from importlib import import_module

__all__ = ["trading"]

try:
    trading = import_module("bagbot.trading")
    sys.modules.setdefault("bagbot.trading", trading)
except Exception:  # pragma: no cover - fallback stub
    trading = None  # type: ignore


def __getattr__(name: str):
    if name == "trading":
        if "bagbot.trading" not in sys.modules:
            try:
                sys.modules["bagbot.trading"] = import_module("bagbot.trading")
            except Exception as exc:  # pragma: no cover - defensive
                raise AttributeError("bagbot.trading unavailable") from exc
        return sys.modules["bagbot.trading"]
    raise AttributeError(f"module 'bagbot' has no attribute {name}")
