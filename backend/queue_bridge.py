from worker.queue import JobQueue
from worker.tasks import JobType

queue = JobQueue()


def submit_job(job_type: str, payload: dict) -> dict:
    """Submit a job to the worker queue."""
    job_type_enum = JobType[job_type]
    job_id = queue.add_job(job_type_enum.value, payload)
    return {"queued": True, "job_type": job_type_enum.value}
