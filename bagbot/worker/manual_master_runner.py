#!/usr/bin/env python3
from worker.queue import JobQueue
from worker.tasks import JobType
from worker.brain.brain import TradingBrain
from worker.brain.strategy_router import StrategyRouter

def main():
    q = JobQueue()
    router = StrategyRouter(None)
    brain = TradingBrain(router)
    q.add_job(JobType.PRICE_UPDATE.value, {"symbol":"BTCUSDT","price":65000})
    q.add_job(JobType.SIGNAL_CHECK.value, {"symbol":"BTCUSDT"})
    # use existing runner loop: call brain.process() until empty
    while True:
        job = q.get_next_job()
        if not job:
            break
        job_type = job.get("type")
        payload = job.get("payload")
        brain.process(job_type, payload)
    print("MANUAL MASTER RUNNER: completed (dry run)")

if __name__ == "__main__":
    main()
