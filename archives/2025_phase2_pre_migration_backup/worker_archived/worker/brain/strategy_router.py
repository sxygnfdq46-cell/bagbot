from worker.tasks import JobType
from worker.strategies.registry import get_strategy
from worker.strategies.registry import STRATEGY_REGISTRY
from worker.indicators.registry import indicator_registry
from worker.ai.engine import AIDecisionEngine

class StrategyRouter:
    def __init__(self, market_state=None):
        """
        Router for selecting strategy handlers.
        
        Accepts an optional market_state so tests can instantiate without arguments.
        If market_state is provided, store it; otherwise leave None and allow it to
        be set later by the brain.
        """
        self.market_state = market_state
        # existing initialization (do not remove) — keep any existing attributes below
        self.indicator_engine = {}
        self.ai_engine = AIDecisionEngine()

    def handle(self, job_type: JobType, payload: dict):
        """
        Route job types to placeholder handler methods.
        NO strategy logic.
        NO trading logic.
        NO math.
        """
        if job_type == JobType.SIGNAL_CHECK:
            return self._handle_signal_check(payload)
        if job_type == JobType.EXECUTE_TRADE:
            return self._handle_execute_trade(payload)
        if job_type == JobType.SYNC_STATE:
            return self._handle_sync_state(payload)
        if job_type == JobType.HEARTBEAT:
            return self._handle_heartbeat(payload)
        # price updates are already handled in brain.process, so ignore here

    def _handle_signal_check(self, payload: dict):
        if self.market_state is not None:
            if hasattr(self.market_state, "get_snapshot"):
                snapshot = self.market_state.get_snapshot()
            else:
                snapshot = {}
        return {}  # placeholder return

    def _handle_execute_trade(self, payload: dict):
        return {}  # placeholder

    def _handle_sync_state(self, payload: dict):
        return {}  # placeholder

    def _handle_heartbeat(self, payload: dict):
        return {}  # placeholder


def get_strategy(name: str = "example"):
    """
    Return an *instance* of the strategy class registered under `name`.
    - If the name is present in STRATEGY_REGISTRY, instantiate and return it.
    - If missing, return None.
    Do NOT implement trading logic. Do NOT import anything else.
    """
    cls = STRATEGY_REGISTRY.get(name)
    if cls is None:
        return None
    # Special case for ai_fusion: needs market_state parameter
    if name == "ai_fusion":
        return cls()
    return cls()

