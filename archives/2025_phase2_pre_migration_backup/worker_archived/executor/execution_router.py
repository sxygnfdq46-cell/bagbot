"""Execution router skeleton: accepts Signal objects and uses RiskManager+Account to produce ExecutionResult.
NO external calls. Deterministic behavior only.
"""
from typing import Optional
from worker.decisions.schema import Signal
from .risk_manager import RiskManager
from .account import Account
from .execution_types import Position, ExecutionResult

class ExecutionRouter:
    def __init__(self, account: Optional[Account] = None, risk_manager: Optional[RiskManager] = None):
        self.account = account or Account()
        self.risk_manager = risk_manager or RiskManager()

    def execute(self, symbol: str, signal: Signal) -> ExecutionResult:
        """
        Accept a Signal and return an ExecutionResult.
        - Do NOT call any exchange or API.
        - For action BUY/SELL, create an in-memory Position and return success True.
        - For HOLD, return success False with message "HOLD".
        """
        if signal.action == "HOLD":
            return ExecutionResult(success=False, message="HOLD")

        # Determine size deterministically using RiskManager
        allowed = self.risk_manager.allowed_size(symbol, signal.size)

        # Build a dummy entry_price (use 0.0 as placeholder)
        side = "LONG" if signal.action == "BUY" else "SHORT"
        pos = Position(symbol=symbol, side=side, entry_price=0.0, size=allowed)
        # Register on account (in-memory)
        self.account.open_position(pos)
        return ExecutionResult(success=True, message="SIMULATED", position=pos)
