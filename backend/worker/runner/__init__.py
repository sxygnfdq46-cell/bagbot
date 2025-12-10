"""Runtime shim to call the brain adapter without side effects.

- Import-safe: no network, threads, or registries on import.
- Metrics are injected via metrics_client; nothing global is created.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

_FAKE_VALUES = {"1", "true", "yes", "on"}


def _fake_mode_enabled(env: Optional[dict[str, str]] = None) -> bool:
    env_ref = env or os.environ
    return env_ref.get("BRAIN_FAKE_MODE", "").strip().lower() in _FAKE_VALUES


def _load_adapter(adapter_module: Any = None):
    if adapter_module:
        return adapter_module
    from backend.brain import adapter  # lazy import to keep import safety

    return adapter


def get_brain_decision(
    signals: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None,
    *,
    metrics_client: Any = None,
    adapter_module: Any = None,
    fake_mode: Optional[bool] = None,
) -> Dict[str, Any]:
    """Return a decision from the brain adapter.

    - Delegates to backend.brain.adapter.decide.
    - Respects BRAIN_FAKE_MODE (or explicit fake_mode) to allow deterministic outputs.
    - Metrics are optional and injected; adapter handles the increment.
    """

    adapter = _load_adapter(adapter_module)
    use_fake_mode = _fake_mode_enabled() if fake_mode is None else fake_mode
    return adapter.decide(
        signals or {},
        config or {},
        metrics_client=metrics_client,
        fake_mode=use_fake_mode,
    )


__all__ = ["get_brain_decision"]
