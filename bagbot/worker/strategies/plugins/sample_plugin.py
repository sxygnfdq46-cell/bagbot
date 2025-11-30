from worker.strategies.plugin import PluginBase

class SamplePlugin(PluginBase):
    def on_price_update(self, market_snapshot):
        # no logic — stub only
        raise NotImplementedError("SamplePlugin.on_price_update not implemented")

    def on_signal_check(self, payload):
        raise NotImplementedError("SamplePlugin.on_signal_check not implemented")
