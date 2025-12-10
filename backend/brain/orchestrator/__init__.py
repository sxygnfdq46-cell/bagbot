"""Multi-provider orchestrator (import-safe, deterministic).

Public entrypoint: orchestrate_providers(payload, *, metrics_client=None, fake_mode=None).
"""

from .core import orchestrate_providers

__all__ = ["orchestrate_providers"]
