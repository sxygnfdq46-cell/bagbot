from typing import Type, Dict
from bagbot.worker.strategies.base import StrategyBase
from bagbot.worker.strategies.example_strategy import ExampleStrategy
from bagbot.worker.strategies.ai_fusion import AIFusionStrategy

_registry: Dict[str, Type[StrategyBase]] = {}

STRATEGY_REGISTRY = {
    "example": ExampleStrategy,
    "ai_fusion": AIFusionStrategy,
}

def register_strategy(name, strategy):
    """
    Register a strategy by name. `strategy` may be either:
      - a class (callable) which will be instantiated later via get_strategy()
      - an instance (non-class). In that case we register a factory that returns the instance.
    This keeps compatibility with tests that register instances.
    """
    # If given a class/type, store it directly
    try:
        is_class = isinstance(strategy, type)
    except Exception:
        is_class = False

    if is_class:
        STRATEGY_REGISTRY[name] = strategy
    else:
        # store a factory that ignores config and returns the same instance
        STRATEGY_REGISTRY[name] = (lambda inst: (lambda config=None: inst))(strategy)

def unregister_all_strategies():
    """Remove all registered strategies (used by tests to reset state)."""
    STRATEGY_REGISTRY.clear()

# Optionally provide unregister_strategy(name)
def unregister_strategy(name):
    """Remove a single registered strategy if present."""
    STRATEGY_REGISTRY.pop(name, None)

def register(name: str, cls: Type[StrategyBase]) -> None:
    _registry[name] = cls

def get_strategy(name: str) -> Type[StrategyBase]:
    return _registry.get(name)

def list_strategies() -> list:
    return list(_registry.keys())
