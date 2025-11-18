"""Risk management and order sizing helpers."""
from dataclasses import dataclass


@dataclass
class RiskManager:
    """Simple risk manager for sizing and basic checks.

    - `max_position_size`: maximum position as fraction of portfolio value (0-1)
    - `risk_per_trade`: fraction of portfolio value to risk per trade (0-1)
    - `stop_loss_pct`: expected stop-loss distance as fraction of price (0-1)
    """

    max_position_size: float = 0.2
    risk_per_trade: float = 0.01
    stop_loss_pct: float = 0.02

    def position_size_by_risk(self, equity: float, price: float) -> float:
        """Calculate position size (in units of the asset) based on risk per trade and stop-loss.

        size = (equity * risk_per_trade) / (price * stop_loss_pct)
        Then cap by max_position_size*equity/price.
        """
        if price <= 0 or equity <= 0:
            return 0.0
        raw_size = (equity * self.risk_per_trade) / (price * self.stop_loss_pct)
        max_size = (equity * self.max_position_size) / price
        size = min(raw_size, max_size)
        # avoid tiny fractions
        return float(max(size, 0.0))

    def check_position_limit(self, current_position: float, new_size: float, price: float, equity: float) -> bool:
        """Return True if adding `new_size` to `current_position` stays within limits."""
        projected_value = (current_position + new_size) * price
        return projected_value <= equity * self.max_position_size
