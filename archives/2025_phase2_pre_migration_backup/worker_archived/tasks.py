"""
Task definitions for the worker.

PURE PYTHON ONLY. NO logic. NO API calls.

Define the following:

1. Enum JobType:
   - PRICE_UPDATE
   - SIGNAL_CHECK
   - EXECUTE_TRADE
   - SYNC_STATE
   - HEARTBEAT

2. Data classes (empty stubs with type hints only):
   - PriceUpdatePayload(symbol: str, price: float)
   - SignalCheckPayload(symbol: str)
   - ExecuteTradePayload(symbol: str, side: str, amount: float)
   - SyncStatePayload(user_id: str)
   - HeartbeatPayload(timestamp: float)

3. Function stubs (empty, only signatures):
   - handle_price_update(payload)
   - handle_signal_check(payload)
   - handle_execute_trade(payload)
   - handle_sync_state(payload)
   - handle_heartbeat(payload)

Rules:
• Only imports allowed: enum, dataclasses
• Each function body must contain only: pass
• No additional imports, no extra functions, no logic.
• Do not modify any other files.
• After writing these structures, STOP and wait for approval.
"""

from enum import Enum
from dataclasses import dataclass


class JobType(Enum):
    PRICE_UPDATE = "PRICE_UPDATE"
    SIGNAL_CHECK = "SIGNAL_CHECK"
    EXECUTE_TRADE = "EXECUTE_TRADE"
    SYNC_STATE = "SYNC_STATE"
    HEARTBEAT = "HEARTBEAT"


@dataclass
class PriceUpdatePayload:
    symbol: str
    price: float


@dataclass
class SignalCheckPayload:
    symbol: str


@dataclass
class ExecuteTradePayload:
    symbol: str
    side: str
    amount: float


@dataclass
class SyncStatePayload:
    user_id: str


@dataclass
class HeartbeatPayload:
    timestamp: float


def handle_price_update(payload):
    pass


def handle_signal_check(payload):
    pass


def handle_execute_trade(payload):
    pass


def handle_sync_state(payload):
    pass


def handle_heartbeat(payload):
    pass