from bagbot.worker.strategies.base import StrategyBase

class DummyStrategy(StrategyBase):
    def on_price_update(self, market_state):
        raise NotImplementedError("DummyStrategy.on_price_update not implemented")

    def on_signal_check(self, payload):
        raise NotImplementedError("DummyStrategy.on_signal_check not implemented")

    def on_execute_trade(self, payload):
        raise NotImplementedError("DummyStrategy.on_execute_trade not implemented")

class SimpleMovingAverageStrategy(StrategyBase):
    def on_price_update(self, market_state):
        raise NotImplementedError("SimpleMovingAverageStrategy.on_price_update not implemented")

    def on_signal_check(self, payload):
        raise NotImplementedError("SimpleMovingAverageStrategy.on_signal_check not implemented")

    def on_execute_trade(self, payload):
        raise NotImplementedError("SimpleMovingAverageStrategy.on_execute_trade not implemented")
