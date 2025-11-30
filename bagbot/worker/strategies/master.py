from typing import Dict, Any, List
from worker.strategies.plugin_registry import get_plugin_class

class MasterStrategy:
    """
    Master strategy controller that manages multiple plugins.
    DO NOT implement trading logic here. Only orchestration stubs.
    """
    def __init__(self, plugin_names: List[str] = None, plugin_configs: Dict[str, Dict[str, Any]] = None):
        self.plugin_names = plugin_names or []
        self.plugin_configs = plugin_configs or {}
        self.plugins = []
        # instantiate plugins by name (if class available)
        for name in self.plugin_names:
            cls = get_plugin_class(name)
            if cls is None:
                continue
            cfg = self.plugin_configs.get(name, {})
            self.plugins.append(cls(cfg))

    def evaluate_on_price(self, market_snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called on PRICE_UPDATE. Iterate plugins and collect their outputs.
        Return a combined placeholder dict (no logic).
        """
        results = {}
        for plugin in self.plugins:
            # call plugin method but do not assume return shape
            try:
                _ = plugin.on_price_update(market_snapshot)
            except NotImplementedError:
                pass
            except Exception:
                pass
        return results

    def evaluate_on_signal_check(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        results = {}
        for plugin in self.plugins:
            try:
                _ = plugin.on_signal_check(payload)
            except NotImplementedError:
                pass
            except Exception:
                pass
        return results
