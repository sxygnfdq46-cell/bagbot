# worker/manual_test_runner.py
#!/usr/bin/env python3
from bagbot.worker.queue import JobQueue
from bagbot.worker.tasks import JobType
from bagbot.worker.runner import run_once_or_process_all  # adapt to actual public name

# If worker.runner provides main() that processes jobs from an internal queue, instead import worker.runner and call the API documented there. Do not add new functions to other files.

def main():
    q = JobQueue()
    q.add_job(JobType.PRICE_UPDATE, {"symbol":"BTCUSDT","price":60000})
    q.add_job(JobType.SIGNAL_CHECK, {"symbol":"ETHUSDT"})
    q.add_job(JobType.HEARTBEAT, {})
    # call the runner to process jobs synchronously
    run_once_or_process_all(q)  # or call the runner API that processes given job queue
    print("MANUAL RUNNER: processed jobs, no exceptions")

if __name__ == "__main__":
    main()
