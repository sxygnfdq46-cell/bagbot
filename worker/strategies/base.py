from typing import Dict, Any

class StrategyBase:
    """
    Abstract strategy interface.
    All methods are stubs and must raise NotImplementedError.
    No implementations, no trading logic.
    """
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config

    def on_price_update(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called when price updates arrive.
        Should return a signal dict in future.
        For now raise NotImplementedError.
        """
        raise NotImplementedError("on_price_update not implemented")

    def on_signal_check(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("on_signal_check not implemented")

    def on_execute_trade(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("on_execute_trade not implemented")
