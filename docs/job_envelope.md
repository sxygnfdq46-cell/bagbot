# Worker job envelope contract

**Purpose:** canonical shape for worker job messages flowing through the queue and reported to clients. No runtime code change here — contract + expectations only.

---

## Envelope shape (JSON)

```json
{
  "job_id": "<string>",            // unique id from the queue
  "job_path": "backend.workers.tasks.<fn>",
  "args": [/* positional args */],
  "kwargs": { /* keyword args */ },
  "state": "enqueued|running|done|error",
  "ts_enqueued": 1672531200,         // epoch seconds
  "ts_started": 1672531201,          // optional
  "ts_finished": 1672531205,         // optional
  "error": null                      // optional string when state=error
}
```

- `job_id`: required string (opaque queue id).
- `job_path`: required string (fully-qualified callable path).
- `args`/`kwargs`: required; may be empty lists/dicts; must be JSON-serializable.
- `state`: required; one of `enqueued`, `running`, `done`, `error`.
- `ts_enqueued`: required epoch seconds (int).
- `ts_started`/`ts_finished`: optional epoch seconds; include when known.
- `error`: optional string describing failure; present when `state=error`.

Timestamps use **epoch seconds (int)**. If you add ISO8601 later, emit both for one release cycle (compatibility rule below).

---

## Lifecycle examples

`enqueued`

```json
{
  "job_id": "job-123",
  "job_path": "backend.workers.tasks.worker_heartbeat",
  "args": [],
  "kwargs": {"timestamp": 1672531200},
  "state": "enqueued",
  "ts_enqueued": 1672531200
}
```

`running`

```json
{
  "job_id": "job-123",
  "job_path": "backend.workers.tasks.worker_heartbeat",
  "args": [],
  "kwargs": {"timestamp": 1672531200},
  "state": "running",
  "ts_enqueued": 1672531200,
  "ts_started": 1672531201
}
```

`done`

```json
{
  "job_id": "job-123",
  "job_path": "backend.workers.tasks.worker_heartbeat",
  "args": [],
  "kwargs": {"timestamp": 1672531200},
  "state": "done",
  "ts_enqueued": 1672531200,
  "ts_started": 1672531201,
  "ts_finished": 1672531205
}
```

`error`

```json
{
  "job_id": "job-123",
  "job_path": "backend.workers.tasks.worker_heartbeat",
  "args": [],
  "kwargs": {"timestamp": 1672531200},
  "state": "error",
  "ts_enqueued": 1672531200,
  "ts_started": 1672531201,
  "ts_finished": 1672531202,
  "error": "Timeout talking to worker"
}
```

---

## Compatibility rules (frontend/backends)

- Additive changes only: prefer adding optional fields rather than changing required ones.
- Consumers should tolerate extra keys in the envelope.
- If adding ISO8601 timestamps later, emit both epoch (`ts_*`) and ISO fields for one release cycle.
- Keep `state` values stable; if introducing new states, announce and document.

---

## Validation notes

- All fields must be JSON-serializable (no datetimes/bytes; use epoch ints).
- `job_path` must be a non-empty string.
- `args` and `kwargs` must be present (may be empty), never omitted.
- `error` should be provided when `state=error`; otherwise may be null/omitted.

---

## Change log

- v1.0 — initial job envelope contract (enqueued, running, done, error).
