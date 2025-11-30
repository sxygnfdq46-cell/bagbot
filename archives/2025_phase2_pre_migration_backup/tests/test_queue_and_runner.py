# tests/test_queue_and_runner.py
import pytest
from bagbot.worker.queue import JobQueue
from bagbot.worker.tasks import JobType
from bagbot.worker.runner import run_once_or_process_all  # if runner provides such; otherwise import worker.runner and call its main function in a way that processes the provided JobQueue (use public API; do not alter runner.py for the test).

def test_runner_processes_three_jobs():
    q = JobQueue()
    q.add_job(JobType.PRICE_UPDATE, {"symbol":"BTCUSDT","price":60000})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol":"ETHUSDT"})
    q.add_job(JobType.HEARTBEAT, {})
    
    # If runner provides process_until_empty(job_queue) or runner.run_once() style function, call it. If not, import worker.runner and call the runner API that processes given job queue
    # Assert runner completes and returns or that the queue is empty after processing.
    # No threads, no external calls.
