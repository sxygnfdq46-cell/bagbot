from typing import Dict, Any
from worker.executor.account import VirtualAccount
from worker.executor.position import VirtualPosition

class VirtualExecutor:
    """
    Advanced virtual executor skeleton.
    Handles entry, exit, SL, TP, fees, slippage — but NO logic yet.
    """
    def __init__(self, account: VirtualAccount):
        self.account = account

    def open_position(self, symbol: str, direction: str, size: float, entry_price: float, config: Dict[str, Any]):
        try:
            pos = VirtualPosition(symbol, direction, size, entry_price, config)
            self.account.add_position(pos)
            return {"opened": True, "position": pos.to_dict()}
        except Exception:
            return {"opened": False}

    def close_position(self, pos: VirtualPosition, price: float):
        try:
            self.account.close_position(pos)
            return {"closed": True, "price": price}
        except Exception:
            return {"closed": False}

    def apply_stop_loss(self, pos: VirtualPosition, price: float):
        return {"sl_checked": True}

    def apply_take_profit(self, pos: VirtualPosition, price: float):
        return {"tp_checked": True}

    def update_equity(self, snapshot: Dict[str, Any]):
        """
        Stub only — no math.
        """
        try:
            self.account.equity_history.append(snapshot)
        except Exception:
            pass
