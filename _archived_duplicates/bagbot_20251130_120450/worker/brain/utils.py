"""Brain utility functions for strategy resolution and type handling."""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def resolve_strategy(name: str) -> Optional[object]:
    """
    Resolve a strategy by name from the registry.
    
    Args:
        name: Strategy name to look up in the registry
        
    Returns:
        Strategy instance if found, None otherwise
        
    Note:
        Never raises exceptions - returns None on any error.
        Logs error messages when strategy cannot be resolved.
    """
    from bagbot.worker.brain.strategy_router import get_strategy
    
    try:
        strategy = get_strategy(name)
        if strategy is None:
            logger.error("Brain routing: unknown strategy %s", name)
        return strategy
    except Exception as e:
        logger.error("Failed to resolve strategy %s: %s", name, e)
        return None
