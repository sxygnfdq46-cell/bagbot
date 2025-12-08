from worker.strategies.base import StrategyBase

class ExampleStrategy(StrategyBase):
    def on_price_update(self, snapshot) -> None:
        # do NOT implement trading logic
        # only record that the method was called by returning None
        return None
    
    def on_signal_check(self, payload: dict) -> None:
        # do NOT implement trading logic
        return None
