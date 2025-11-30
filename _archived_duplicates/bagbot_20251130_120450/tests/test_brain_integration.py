# tests/test_brain_integration.py
import pytest
from bagbot.worker.queue import JobQueue
from bagbot.worker.tasks import JobType
from bagbot.worker.brain.brain import Brain
from bagbot.worker.strategies.registry import register_strategy, unregister_all_strategies

class SpyStrategy:
    def __init__(self):
        self.price_updates = []
        self.signal_checks = []
    
    def on_price_update(self, snapshot):
        self.price_updates.append(snapshot)
        return None
    
    def on_signal_check(self, payload):
        self.signal_checks.append(payload)
        return None

def teardown_function(fn):
    # ensure registry reset between tests
    try:
        unregister_all_strategies()
    except Exception:
        pass

def test_brain_routes_price_update_to_strategy():
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('test-spy', spy)
    q.add_job(JobType.PRICE_UPDATE, {"symbol":"BTCUSDT","price":12345})
    brain.process_next_job()  # use the Brain public method that processes a single job; if the API is process_next_job() use that; adjust to call whichever function in brain.py that you previously wired for processing a job — but do not modify other files.
    assert len(spy.price_updates) == 1
    assert spy.price_updates[0]["symbol"] == "BTCUSDT"
    assert spy.price_updates[0]["price"] == 12345

def test_brain_routes_signal_check_to_strategy():
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('test-spy', spy)
    q.add_job(JobType.SIGNAL_CHECK, {"symbol":"ETHUSDT"})
    brain.process_next_job()
    assert len(spy.signal_checks) == 1

def test_no_exceptions_if_strategy_raises():
    q = JobQueue()
    brain = Brain(job_queue=q)
    
    class BrokenStrategy:
        def on_price_update(self, snapshot):
            raise NotImplementedError("test")
    
    broken = BrokenStrategy()
    register_strategy('broken', broken)
    q.add_job(JobType.PRICE_UPDATE, {"symbol":"BTCUSDT","price":12345})
    brain.process_next_job()
    # assert that no exception escapes (i.e., the call completes) and the job is marked completed in queue (if queue exposes job status, assert empty or job removed).

def test_brain_logs_error_when_strategy_missing():
    """Test that brain logs error and stores error state when strategy doesn't exist."""
    unregister_all_strategies()  # Clear registry so ai_fusion doesn't exist
    q = JobQueue()
    brain = Brain(job_queue=q)
    
    # Verify error state is set
    assert hasattr(brain, '_init_error')
    assert brain._init_error is not None
    assert brain._init_error["status"] == "error"
    assert brain._init_error["reason"] == "unknown_strategy"
    assert brain._init_error["strategy"] == "ai_fusion"


# Task 3.3 - Additional integration tests for price update & signal-check flows

def test_brain_processes_multiple_price_updates_in_sequence():
    """Test brain correctly handles multiple price updates in sequence."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('multi-test', spy)
    
    # Add multiple price update jobs
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 50000})
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "ETHUSDT", "price": 3000})
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 51000})
    
    # Process all jobs
    brain.process_next_job()
    brain.process_next_job()
    brain.process_next_job()
    
    # Verify all were captured
    assert len(spy.price_updates) == 3
    assert spy.price_updates[0]["symbol"] == "BTCUSDT"
    assert spy.price_updates[0]["price"] == 50000
    assert spy.price_updates[1]["symbol"] == "ETHUSDT"
    assert spy.price_updates[2]["price"] == 51000


def test_brain_processes_multiple_signal_checks_in_sequence():
    """Test brain correctly handles multiple signal checks in sequence."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('signal-test', spy)
    
    # Add multiple signal check jobs
    q.add_job(JobType.SIGNAL_CHECK, {"symbol": "BTCUSDT", "action": "check_entry"})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol": "ETHUSDT", "action": "check_exit"})
    
    # Process all jobs
    brain.process_next_job()
    brain.process_next_job()
    
    # Verify all were captured
    assert len(spy.signal_checks) == 2
    assert spy.signal_checks[0]["symbol"] == "BTCUSDT"
    assert spy.signal_checks[1]["symbol"] == "ETHUSDT"


def test_brain_routes_mixed_event_types_correctly():
    """Test brain routes mixed event types (price updates and signal checks) correctly."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('mixed-test', spy)
    
    # Add mixed job types
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 45000})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol": "BTCUSDT", "check": "entry"})
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "ETHUSDT", "price": 2800})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol": "ETHUSDT", "check": "exit"})
    
    # Process all jobs
    for _ in range(4):
        brain.process_next_job()
    
    # Verify correct routing
    assert len(spy.price_updates) == 2
    assert len(spy.signal_checks) == 2
    assert spy.price_updates[0]["symbol"] == "BTCUSDT"
    assert spy.signal_checks[0]["symbol"] == "BTCUSDT"


def test_brain_handles_empty_payload_gracefully():
    """Test brain handles jobs with empty/minimal payloads without crashing."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('empty-test', spy)
    
    # Add job with minimal payload
    q.add_job(JobType.PRICE_UPDATE, {})
    q.add_job(JobType.SIGNAL_CHECK, {})
    
    # Should not raise exceptions
    brain.process_next_job()
    brain.process_next_job()
    
    # Verify methods were called even with empty payloads
    assert len(spy.price_updates) == 1
    assert len(spy.signal_checks) == 1


def test_brain_strategy_method_called_with_correct_payload_structure():
    """Test that strategy methods receive payloads with correct structure."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('payload-test', spy)
    
    # Create payload with specific structure
    test_payload = {
        "symbol": "BTCUSDT",
        "price": 48000,
        "volume": 1000,
        "timestamp": "2025-11-23T10:00:00"
    }
    
    q.add_job(JobType.PRICE_UPDATE, test_payload)
    brain.process_next_job()
    
    # Verify spy received exact payload structure
    assert len(spy.price_updates) == 1
    received = spy.price_updates[0]
    assert received["symbol"] == "BTCUSDT"
    assert received["price"] == 48000
    assert received["volume"] == 1000
    assert "timestamp" in received


def test_brain_continues_processing_after_strategy_returns_none():
    """Test brain continues processing even when strategy returns None."""
    q = JobQueue()
    brain = Brain(job_queue=q)
    
    class NoneReturningStrategy:
        def __init__(self):
            self.calls = 0
        
        def on_price_update(self, snapshot):
            self.calls += 1
            return None  # Explicitly return None
        
        def on_signal_check(self, payload):
            self.calls += 1
            return None
    
    strategy = NoneReturningStrategy()
    register_strategy('none-test', strategy)
    
    # Add multiple jobs
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 50000})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol": "BTCUSDT"})
    
    # Process both
    brain.process_next_job()
    brain.process_next_job()
    
    # Verify both were processed despite None returns
    assert strategy.calls == 2


def test_brain_logs_route_start_and_success(caplog):
    """Test that brain logs ROUTE_START and ROUTE_SUCCESS for successful routing."""
    import logging
    caplog.set_level(logging.INFO)
    
    q = JobQueue()
    brain = Brain(job_queue=q)
    spy = SpyStrategy()
    register_strategy('log-test', spy)
    
    # Process a price update
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 50000})
    brain.process_next_job()
    
    # Verify logging occurred
    log_text = caplog.text
    assert "ROUTE_START" in log_text
    assert "ROUTE_SUCCESS" in log_text
    assert "log-test" in log_text
    assert "price_update" in log_text


def test_brain_logs_route_fail_on_exception(caplog):
    """Test that brain logs ROUTE_FAIL when strategy raises exception."""
    import logging
    caplog.set_level(logging.ERROR)
    
    q = JobQueue()
    brain = Brain(job_queue=q)
    
    class FailingStrategy:
        def on_price_update(self, snapshot):
            raise ValueError("Test error")
    
    failing = FailingStrategy()
    register_strategy('failing-test', failing)
    
    # Process a price update that will fail
    q.add_job(JobType.PRICE_UPDATE, {"symbol": "BTCUSDT", "price": 50000})
    brain.process_next_job()
    
    # Verify error logging occurred
    log_text = caplog.text
    assert "ROUTE_FAIL" in log_text
    assert "failing-test" in log_text
    assert "Test error" in log_text
