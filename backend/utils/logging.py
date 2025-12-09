from __future__ import annotations

"""Structured logging helper with redaction and no import-time config."""

import logging
from typing import Any, Dict, Optional

SENSITIVE_KEYS = {"token", "secret", "password", "authorization", "api_key", "apikey", "auth"}


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(part in lowered for part in SENSITIVE_KEYS)


def _redact_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        return "[REDACTED]"
    if isinstance(value, (bytes, bytearray)):
        return b"[REDACTED]"
    return "[REDACTED]"


def redact(data: Any) -> Any:
    """Recursively redact sensitive keys in mappings/lists; leave primitives otherwise."""

    if isinstance(data, dict):
        return {k: (_redact_value(v) if _is_sensitive_key(k) else redact(v)) for k, v in data.items()}
    if isinstance(data, list):
        return [redact(item) for item in data]
    return data


def build_event(
    message: str,
    *,
    request_id: Optional[str] = None,
    route: Optional[str] = None,
    action: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    event = {"message": message}
    if request_id:
        event["request_id"] = request_id
    if route:
        event["route"] = route
    if action:
        event["action"] = action
    if extra:
        event["extra"] = redact(extra)
    return event


def log_event(
    logger: logging.Logger,
    message: str,
    *,
    request_id: Optional[str] = None,
    route: Optional[str] = None,
    action: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
    level: int = logging.INFO,
) -> Dict[str, Any]:
    """Emit a structured log event without configuring global logging.

    The event payload is attached to the log record as `record.event` for easy capture in tests.
    """

    event = build_event(message, request_id=request_id, route=route, action=action, extra=extra)
    logger.log(level, message, extra={"event": event})
    return event


__all__ = ["log_event", "build_event", "redact", "SENSITIVE_KEYS"]
