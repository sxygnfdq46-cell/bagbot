"""Worker decision schema.
This file defines the canonical Signal/Decision data shape used by strategies.
No trading logic here — only data types.
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class Signal:
    action: str              # "BUY" | "SELL" | "HOLD"
    confidence: float        # 0.0 - 1.0
    size: Optional[float]    # position size (could be None)
    reason: Optional[str]    # short human-readable reason
    metadata: Dict[str, Any] # any extra diagnostics; keep as dict

def signal_buy(confidence: float, size: Optional[float] = None, reason: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Signal:
    return Signal(action="BUY", confidence=confidence, size=size, reason=reason, metadata=metadata or {})

def signal_sell(confidence: float, size: Optional[float] = None, reason: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Signal:
    return Signal(action="SELL", confidence=confidence, size=size, reason=reason, metadata=metadata or {})

def signal_hold(reason: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Signal:
    return Signal(action="HOLD", confidence=0.0, size=None, reason=reason, metadata=metadata or {})
