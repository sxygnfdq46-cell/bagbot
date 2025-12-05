# WebSocket envelope and event contract

**Purpose:** single source of truth for WebSocket messages used by BagBot (frontend ↔ backend). Keep this file up to date whenever you add/rename channels or events.

---

## Envelope shape (JSON)

All WebSocket messages use the same outer structure:

```json
{
  "channel": "<string>",   // e.g. "signals", "workers", "system"
  "event": "<string>",     // e.g. "strategy.started", "worker.heartbeat"
  "payload": { /* object */ }, // event-specific data
  "meta": {                   // optional space for routing/trace info
    "job_id": "<string>",
    "timestamp": 1672531200,
    "source": "backend"
  }
}
```

- `channel` groups similar events; clients subscribe by channel.
- `event` is a descriptive verb.noun string (lowercase, dot-separated).
- `payload` contains the actual event data (object; keep small).
- `meta` is optional; helpful for tracing/diagnostics.

---

## Standard channels & example events

### signals — strategy lifecycle & signals

`strategy.started`

```json
{
  "channel": "signals",
  "event": "strategy.started",
  "payload": {
    "strategy_id": "<string>",
    "job_id": "<string>",
    "state": "started",
    "owner": "<string|null>"
  },
  "meta": {"timestamp": 1672531200}
}
```

`strategy.stopped` — same shape, `state = stopped`.

### workers — worker lifecycle & health

`worker.heartbeat`

```json
{
  "channel": "workers",
  "event": "worker.heartbeat",
  "payload": {
    "worker_id": "<string>",
    "timestamp": 1672531200,
    "status": "idle|busy|offline",
    "current_job_id": "<string|null>"
  }
}
```

`worker.job.started`

```json
{
  "channel": "workers",
  "event": "worker.job.started",
  "payload": {
    "worker_id": "<string>",
    "job_id": "<string>",
    "job_path": "backend.workers.tasks.<fn>",
    "timestamp": 1672531200
  }
}
```

### system — administrative notices

`announce` — informational, keep payload small.

---

## Backwards-compatibility rules

- Additive changes only (add new optional fields).
- Consumers should tolerate extra keys in `payload`.
- When renaming keys, emit both old and new keys for one release cycle.

---

## JS client example

```js
socket.on('message', raw => {
  const msg = JSON.parse(raw);
  if (msg.channel === 'workers' && msg.event === 'worker.heartbeat') {
    // handle heartbeat
  }
});
```

---

## Testing & validation

- Add unit tests that build canonical envelopes and assert required fields exist.
- Validate outgoing envelopes in CI where possible.

---

## Change log

- v1.0 — initial contract (heartbeat, job events, strategy state)

```python
# tests/test_ws_envelope.py
from datetime import datetime
import json


def make_worker_heartbeat(worker_id: str, status: str, current_job_id=None):
    return {
        "channel": "workers",
        "event": "worker.heartbeat",
        "payload": {
            "worker_id": worker_id,
            "timestamp": int(datetime.utcnow().timestamp()),
            "status": status,
            "current_job_id": current_job_id,
        },
    }


def test_worker_heartbeat_shape():
    msg = make_worker_heartbeat("worker-1", "idle", None)
    assert isinstance(msg, dict)
    assert msg["channel"] == "workers"
    assert msg["event"] == "worker.heartbeat"
    payload = msg["payload"]
    assert "worker_id" in payload and payload["worker_id"] == "worker-1"
    assert "timestamp" in payload and isinstance(payload["timestamp"], int)
    assert payload["status"] in ("idle", "busy", "offline")
    assert "current_job_id" in payload
    json.dumps(msg)
```
