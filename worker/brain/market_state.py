# worker/brain/market_state.py
from typing import Dict, Any

class MarketState:
    """
    Minimal market state holder.
    Stores the latest value for symbols from price update payloads.
    """
    
    def __init__(self) -> None:
        # simple dict mapping symbol -> latest payload dict
        self.prices: Dict[str, Dict[str, Any]] = {}
    
    def update_from_payload(self, payload: Dict[str, Any]) -> None:
        """
        Accept a payload dict with at least a 'symbol' key.
        Store the entire payload under prices[symbol].
        Do not perform any calculations or validation beyond checking for 'symbol'.
        """
        if not payload:
            return
        
        symbol = payload.get("symbol")
        if not symbol:
            return
        
        # store payload as-is
        self.prices[symbol] = payload
    
    def get_latest(self, symbol: str):
        return self.prices.get(symbol)
    
    def get_snapshot(self):
        """
        Returns a shallow copy of current market state.
        Used only for dry routing. No calculations.
        """
        return dict(self.prices)
