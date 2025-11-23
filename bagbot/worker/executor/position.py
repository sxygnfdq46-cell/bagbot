from typing import Dict, Any

class VirtualPosition:
    """
    Represents a virtual open trade.
    Skeleton only — no trading logic.
    """
    def __init__(self, symbol: str, direction: str, size: float, entry_price: float, config: Dict[str, Any]):
        self.symbol = symbol
        self.direction = direction   # "long" or "short"
        self.size = size
        self.entry_price = entry_price
        self.config = config
        self.stop_loss = None
        self.take_profit = None
        self.metadata = {}

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "direction": self.direction,
            "size": self.size,
            "entry_price": self.entry_price,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "metadata": self.metadata,
        }
