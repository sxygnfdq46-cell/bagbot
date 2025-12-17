# tests/test_virtual_executor.py
import pytest
from bagbot.worker.executor.account import VirtualAccount
from bagbot.worker.executor.position import VirtualPosition
from bagbot.worker.executor.executor import VirtualExecutor

def test_account_initialization():
    account = VirtualAccount(starting_balance=10000.0)
    assert account.balance == 10000.0
    assert isinstance(account.positions, list)
    assert len(account.positions) == 0
    snapshot = account.snapshot()
    assert isinstance(snapshot, dict)
    assert "balance" in snapshot
    assert "positions" in snapshot

def test_open_position_stub():
    account = VirtualAccount()
    executor = VirtualExecutor(account)
    result = executor.open_position("BTCUSDT", "long", 1.0, 50000.0, {})
    assert isinstance(result, dict)
    assert "opened" in result
    if result["opened"]:
        assert "position" in result

def test_close_position_stub():
    account = VirtualAccount()
    executor = VirtualExecutor(account)
    # open then close
    executor.open_position("BTCUSDT", "long", 1.0, 50000.0, {})
    if len(account.positions) > 0:
        pos = account.positions[0]
        result = executor.close_position(pos, 51000.0)
        assert isinstance(result, dict)
        assert "closed" in result

def test_equity_update_stub():
    account = VirtualAccount()
    executor = VirtualExecutor(account)
    snapshot = {"symbol": "BTCUSDT", "price": 50000}
    # should not raise exception
    executor.update_equity(snapshot)
    # equity_history should be list
    assert isinstance(account.equity_history, list)
