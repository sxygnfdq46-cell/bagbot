from typing import Dict, Any

class PluginBase:
    """
    Plugin interface for strategy plugins.
    DO NOT implement logic here — methods must raise NotImplementedError.
    """
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config

    def on_price_update(self, market_snapshot: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("on_price_update not implemented")

    def on_signal_check(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("on_signal_check not implemented")
