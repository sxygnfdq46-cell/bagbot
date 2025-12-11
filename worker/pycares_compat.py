"""Compatibility helpers for pycares / aiodns API changes.

Hosted runners may ship pycares builds lacking ``ares_query_a_result``.
This shim aliases to available query helpers to keep aiodns-compatible
without crashing on import. Safe to import even if pycares is absent.
"""

from __future__ import annotations

import importlib
from typing import Any, Callable, Optional


def _ares_query_wrapper(pycares_module: Optional[Any] = None) -> Callable:
    """Return a callable for A record queries across pycares versions.

    Prefers ``ares_query_a_result`` when present. Falls back to
    ``ares_query``. Raises a descriptive AttributeError if neither is
    available so callers can surface a clear diagnostics message.
    """

    mod = pycares_module
    if mod is None:
        mod = importlib.import_module("pycares")

    if hasattr(mod, "ares_query_a_result"):
        return getattr(mod, "ares_query_a_result")

    if hasattr(mod, "ares_query"):
        return getattr(mod, "ares_query")

    raise AttributeError(
        "pycares is missing both ares_query_a_result and ares_query; "
        "upgrade/downgrade pycares or install a compatible build."
    )


def ensure_pycares_compat(pycares_module: Optional[Any] = None) -> Optional[Callable]:
    """Ensure pycares exposes ares_query_a_result for aiodns callers.

    Returns the callable that should be used for A-record queries, or None
    when pycares is not installed. Will alias ``ares_query_a_result`` to
    a fallback when absent.
    """

    try:
        mod = pycares_module or importlib.import_module("pycares")
    except ImportError:
        return None

    wrapper = _ares_query_wrapper(mod)
    if not hasattr(mod, "ares_query_a_result"):
        mod.ares_query_a_result = wrapper
    return wrapper


__all__ = ["_ares_query_wrapper", "ensure_pycares_compat"]
