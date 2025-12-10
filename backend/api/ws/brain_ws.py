"""Brain decision WebSocket endpoint bridging to the runtime adapter."""
from __future__ import annotations

import contextlib
from collections import defaultdict
from typing import Any, Dict, Tuple

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from backend.schemas.auth import UserProfile
from backend.security.deps import get_current_user_ws

router = APIRouter()

_ACTIVE_CONNECTIONS: set[WebSocket] = set()


class _WsMetrics:
    def __init__(self) -> None:
        self.connects_total = 0
        self.disconnects_total = 0
        self.decisions_total: defaultdict[str, int] = defaultdict(int)

    def inc_connect(self) -> None:
        self.connects_total += 1

    def inc_disconnect(self) -> None:
        self.disconnects_total += 1

    def inc_decision(self, action: str | None) -> None:
        self.decisions_total[action or "unknown"] += 1


METRICS = _WsMetrics()


class _AdapterMetricsProxy:
    def inc(self, name: str, labels: Any = None) -> None:
        if name != "brain_decisions_total":
            return
        action = labels.get("action") if isinstance(labels, dict) else labels
        METRICS.inc_decision(str(action or "unknown"))


def _register(websocket: WebSocket) -> None:
    _ACTIVE_CONNECTIONS.add(websocket)
    METRICS.inc_connect()


def _unregister(websocket: WebSocket) -> None:
    _ACTIVE_CONNECTIONS.discard(websocket)
    METRICS.inc_disconnect()


def _normalize_payload(message: Any) -> Tuple[str, Dict[str, Any]]:
    if not isinstance(message, dict):
        return "", {}

    request_id = str(message.get("request_id") or "")
    snapshot = message.get("market_snapshot") or {}
    if not isinstance(snapshot, dict):
        snapshot = {}

    normalized_signal = {
        "type": snapshot.get("type", "market_snapshot"),
        "provider_id": snapshot.get("provider_id", "ws"),
        "strength": snapshot.get("strength", 0.0),
        "confidence": snapshot.get("confidence", 0.5),
        "timestamp": snapshot.get("timestamp", 0.0),
        "metadata": snapshot.get("metadata") or snapshot,
    }

    return request_id, {"ws": normalized_signal}


def _build_response(request_id: str, decision: Dict[str, Any]) -> Dict[str, Any]:
    rationale = decision.get("rationale") or []
    reason = rationale[0] if isinstance(rationale, list) and rationale else None
    return {
        "type": "brain-decision",
        "request_id": request_id,
        "action": decision.get("action"),
        "confidence": decision.get("confidence"),
        "reason": reason,
        "meta": decision.get("meta") or {},
    }


async def _compute_decision(signals: Dict[str, Any]) -> Dict[str, Any]:
    from backend.worker import runner

    return runner.get_brain_decision(signals, metrics_client=_AdapterMetricsProxy())


@router.websocket("/brain")
async def brain_ws_endpoint(
    websocket: WebSocket,
    user: UserProfile = Depends(get_current_user_ws),
) -> None:
    """Authenticate, relay snapshot payloads to the brain, and stream decisions."""

    await websocket.accept()
    _register(websocket)
    await websocket.send_json({"type": "brain-online", "detail": "ready"})

    try:
        while True:
            message = await websocket.receive_json()
            request_id, signals = _normalize_payload(message)

            if not signals:
                await websocket.send_json(
                    {"type": "brain-error", "request_id": request_id, "detail": "invalid payload"}
                )
                continue

            decision = await _compute_decision(signals)
            response = _build_response(request_id, decision)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        pass
    finally:
        _unregister(websocket)
        with contextlib.suppress(RuntimeError):
            await websocket.close()


__all__ = ["brain_ws_endpoint", "METRICS", "_normalize_payload"]
