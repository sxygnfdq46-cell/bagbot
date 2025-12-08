"""Execution types used by the executor. No real execution, only in-memory types."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class Position:
    symbol: str
    side: str              # "LONG" or "SHORT"
    entry_price: float
    size: float
    pnl: float = 0.0

@dataclass
class ExecutionResult:
    success: bool
    message: Optional[str] = None
    position: Optional[Position] = None
