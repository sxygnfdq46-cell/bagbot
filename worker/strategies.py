"""Trading strategy interfaces stub."""

from typing import Dict, Any

class StrategyBase:
    """Abstract strategy interface."""
    
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
    
    def compute_signal(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """Return a trade signal. (Not implemented)"""
        raise NotImplementedError("compute_signal not implemented")