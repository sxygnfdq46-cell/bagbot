# tests/test_brain_integration.py
import pytest
from worker.queue import JobQueue
from worker.tasks import JobType
from worker.brain.brain import Brain
from worker.strategies.registry import register_strategy, unregister_all_strategies

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
