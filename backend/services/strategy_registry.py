"""In-memory strategy registry for routing worker jobs."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class StrategyMeta:
    strategy_id: str
    job_path: str = "backend.workers.tasks.strategy_toggle"
    name: str | None = None
    metadata: Dict[str, str] = field(default_factory=dict)


class StrategyRegistry:
    def __init__(self) -> None:
        self._entries: Dict[str, StrategyMeta] = {}

    def register(self, meta: StrategyMeta) -> StrategyMeta:
        """Register a new strategy in the registry.

        Args:
            meta (StrategyMeta): The strategy metadata to register.

        Returns:
            StrategyMeta: The registered strategy metadata.
        """
        self._entries[meta.strategy_id] = meta
        return meta

    def get(self, strategy_id: str) -> Optional[StrategyMeta]:
        """Retrieve a strategy from the registry by its ID.

        Args:
            strategy_id (str): The ID of the strategy to retrieve.

        Returns:
            Optional[StrategyMeta]: The strategy metadata if found, else None.
        """
        return self._entries.get(strategy_id)

    def list(self) -> List[StrategyMeta]:
        """List all registered strategies in the registry.

        Returns:
            List[StrategyMeta]: A list of all registered strategy metadata.
        """
        return list(self._entries.values())


_default_registry: StrategyRegistry | None = None


def load_default_registry() -> StrategyRegistry:
    """Load or initialize the global strategy registry."""
    global _default_registry
    if _default_registry is None:
        registry = StrategyRegistry()
        registry.register(StrategyMeta(strategy_id="default"))
        _default_registry = registry
    return _default_registry


def register_strategy(meta: StrategyMeta) -> StrategyMeta:
    """Register a strategy in the default registry."""
    registry = load_default_registry()
    return registry.register(meta)


__all__ = [
    "StrategyMeta",
    "StrategyRegistry",
    "load_default_registry",
    "register_strategy",
]
