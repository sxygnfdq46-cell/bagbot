"""Shims to keep legacy ``api`` imports working."""
from importlib import import_module
import sys
import types

__all__ = [
    "admin_routes",
    "strategies",
    "tradingview_routes",
    "knowledge_feeder_api",
    "example",
    "testclient",
]


def _alias(name: str, target: str):
    """Alias ``api.<name>`` to an existing module if present."""

    try:
        module = import_module(target)
    except Exception:
        module = types.ModuleType(name)
    sys.modules[f"api.{name}"] = module
    return module

admin_routes = _alias("admin_routes", "backend.api.admin_routes")
strategies = _alias("strategies", "backend.api.strategies")
tradingview_routes = _alias("tradingview_routes", "backend.api.tradingview_routes")
knowledge_feeder_api = _alias("knowledge_feeder_api", "backend.api.knowledge_feeder_api")
example = _alias("example", "backend.api.example")
testclient = _alias("testclient", "fastapi.testclient")

try:  # pragma: no cover - best-effort safety
    from fastapi import APIRouter  # type: ignore
except Exception:  # pragma: no cover
    APIRouter = None  # type: ignore

if getattr(tradingview_routes, "router", None) is None:
    tradingview_routes.router = APIRouter() if APIRouter else None  # type: ignore[attr-defined]

if getattr(testclient, "TestClient", None) is None:
    try:
        from fastapi.testclient import TestClient  # type: ignore
        testclient.TestClient = TestClient  # type: ignore[attr-defined]
    except Exception:
        testclient.TestClient = None  # type: ignore[attr-defined]
