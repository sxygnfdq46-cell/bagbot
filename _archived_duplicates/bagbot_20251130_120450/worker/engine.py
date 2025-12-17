"""
Worker engine: routes jobs to handlers.

PURE ROUTING ONLY.
NO trading logic.
NO math.
NO exchange API calls.
NO strategy.

Allowed imports:
- from worker.queue import JobQueue
- from worker.tasks import JobType, handle_price_update, handle_signal_check, handle_execute_trade, handle_sync_state, handle_heartbeat

Create a class WorkerEngine with:

Attributes:
- job_queue: JobQueue

Methods (all require pass placeholders where logic would go):
- __init__(self, job_queue)
- process_next_job(self):
    • Retrieve next job
    • Route to correct handler (BUT call handler with 'pass' placeholders — do NOT implement logic)
    • Mark job completed
    • If no job exists, simply return None

- dispatch(self, job_type, payload):
    • Add a job to the queue

Important:
• process_next_job must contain ONLY job retrieval, handler selection, and mark completed.
• DO NOT implement what handlers do.
• DO NOT add any business logic.
• DO NOT add external libraries.
• DO NOT modify other files.

After implementing this file, STOP and wait for approval.
"""

from bagbot.worker.queue import JobQueue
from bagbot.worker.tasks import JobType, handle_price_update, handle_signal_check, handle_execute_trade, handle_sync_state, handle_heartbeat
from bagbot.worker.utils import log_job_received, log_job_completed, log
from bagbot.worker.brain.brain import TradingBrain
from bagbot.worker.brain.strategy_router import StrategyRouter


class WorkerEngine:
    """Routes jobs to handlers."""
    
    def __init__(self, job_queue):
        """Initialize engine with job queue."""
        self.job_queue = job_queue
        router = StrategyRouter(None)  # will be updated by brain
        self.brain = TradingBrain(router)
    
    def process_next_job(self):
        """Retrieve next job, route to handler, mark completed."""
        job = self.job_queue.get_next_job()
        
        if job is None:
            return None
        
        job_type = job.get("type")
        payload = job.get("payload")
        job_id = job.get("id")
        
        log(f"processing job {job_id} of type {job_type}")
        log_job_received(job_type, payload)
        
        self.brain.process(job_type, payload)
        
        if job_type == JobType.PRICE_UPDATE.value:
            handle_price_update(payload)
        elif job_type == JobType.SIGNAL_CHECK.value:
            handle_signal_check(payload)
        elif job_type == JobType.EXECUTE_TRADE.value:
            handle_execute_trade(payload)
        elif job_type == JobType.SYNC_STATE.value:
            handle_sync_state(payload)
        elif job_type == JobType.HEARTBEAT.value:
            handle_heartbeat(payload)
        
        log_job_completed(job_type)
        self.job_queue.mark_completed(job_id)
        log(f"finished job {job_id}")
        
        return job_id
    
    def dispatch(self, job_type, payload):
        """Add a job to the queue."""
        return self.job_queue.add_job(job_type, payload)