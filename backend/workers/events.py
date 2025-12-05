from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional

from backend.ws.manager import websocket_broadcast

SIGNALS_CHANNEL = "signals"


def _now_ms() -> int:
    return int(time.time() * 1000)


async def broadcast_worker_heartbeat(
    worker_id: str,
    ts: Optional[int] = None,
) -> Dict[str, Any]:
    """Broadcast worker heartbeat event and return the envelope."""

    timestamp = ts or _now_ms()
    envelope: Dict[str, Any] = {
        "channel": SIGNALS_CHANNEL,
        "event": "worker.heartbeat",
        "payload": {"worker_id": worker_id, "ts": timestamp},
        "ts": timestamp,
    }
    # use existing broadcast helper
    await websocket_broadcast(
        channel=SIGNALS_CHANNEL,
        event="worker.heartbeat",
        payload=envelope["payload"],
    )
    # sanity: ensure JSON-serializable
    json.dumps(envelope)
    return envelope


async def broadcast_job_event(
    job_id: str,
    job_path: str,
    state: str,
    payload: Optional[Dict[str, Any]] = None,
    ts: Optional[int] = None,
) -> Dict[str, Any]:
    """Broadcast worker job lifecycle event and return the envelope."""

    timestamp = ts or _now_ms()
    job_payload: Dict[str, Any] = {
        "job_id": job_id,
        "job_path": job_path,
        "state": state,
        "ts": timestamp,
    }
    if payload:
        job_payload.update(payload)

    event_name = f"worker.job.{state}"
    envelope: Dict[str, Any] = {
        "channel": SIGNALS_CHANNEL,
        "event": event_name,
        "payload": job_payload,
        "ts": timestamp,
    }
    await websocket_broadcast(
        channel=SIGNALS_CHANNEL,
        event=event_name,
        payload=job_payload,
    )
    json.dumps(envelope)
    return envelope
