"""Risk manager skeleton. Returns allowed size for a requested signal.
Do NOT implement risk rules. Provide a deterministic stub.
"""
from typing import Optional

class RiskManager:
    def __init__(self, account_balance: float = 10000.0):
        self.account_balance = account_balance

    def allowed_size(self, symbol: str, requested_size: Optional[float]) -> float:
        """
        Deterministic stub: if requested_size provided, return it;
        otherwise return a tiny default fraction of account_balance (no trading logic).
        """
        if requested_size is not None:
            return float(requested_size)
        # deterministic fallback
        return max(1.0, self.account_balance * 0.001)
