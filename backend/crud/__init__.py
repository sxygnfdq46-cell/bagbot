"""Minimal in-memory CRUD stubs for tests."""
from __future__ import annotations

from types import SimpleNamespace
from typing import Any, Dict, Optional, Sequence

_strategy_store: Dict[str, SimpleNamespace] = {}
_report_store: Dict[str, Dict[str, Any]] = {}


async def create_strategy(
    session,
    *,
    name: str,
    timeframe: str,
    params: Dict[str, Any] | None = None,
    stats: Dict[str, Any] | None = None,
    description: str | None = None,
    enabled: bool = False,
):
    sid = f"strat-{len(_strategy_store) + 1}"
    obj = SimpleNamespace(
        id=sid,
        name=name,
        timeframe=timeframe,
        params=params or {},
        stats=stats or {},
        description=description,
        enabled=enabled,
        last_run=None,
    )
    _strategy_store[sid] = obj
    return obj


async def list_strategies(session) -> Sequence[SimpleNamespace]:
    return list(_strategy_store.values())


async def get_strategy(session, strategy_id: str) -> Optional[SimpleNamespace]:
    return _strategy_store.get(strategy_id)


async def update_strategy(session, strategy_id: str, **updates: Any) -> Optional[SimpleNamespace]:
    obj = _strategy_store.get(strategy_id)
    if not obj:
        return None
    for key, value in updates.items():
        setattr(obj, key, value)
    return obj


async def toggle_strategy(session, strategy_id: str) -> Optional[SimpleNamespace]:
    obj = _strategy_store.get(strategy_id)
    if not obj:
        return None
    obj.enabled = not getattr(obj, "enabled", False)
    return obj


async def delete_strategy(session, strategy_id: str) -> bool:
    return _strategy_store.pop(strategy_id, None) is not None


async def create_report(session, *, strategy_id: str, status: str = "queued", job_id: str | None = None, payload: Dict[str, Any] | None = None):
    rid = f"report-{len(_report_store) + 1}"
    data = {"id": rid, "strategy_id": strategy_id, "status": status, "job_id": job_id, "payload": payload or {}}
    _report_store[rid] = data
    return SimpleNamespace(**data)


async def get_report(session, report_id: str):
    if report_id in _report_store:
        return SimpleNamespace(**_report_store[report_id])
    return None


async def update_report(session, report_id: str, **updates: Any):
    if report_id not in _report_store:
        return None
    _report_store[report_id].update(updates)
    return SimpleNamespace(**_report_store[report_id])


__all__ = [
    "create_strategy",
    "list_strategies",
    "get_strategy",
    "update_strategy",
    "toggle_strategy",
    "delete_strategy",
    "create_report",
    "get_report",
    "update_report",
]
