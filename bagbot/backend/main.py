from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from api.routes import router as api_router
from backend.queue_bridge import submit_job
from worker.tasks import JobType

app = FastAPI(title="Bagbot Backend")

app.include_router(api_router)


class JobSubmission(BaseModel):
    job_type: str
    payload: dict


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "bagbot backend"}


@app.post("/jobs")
async def submit_job_endpoint(job: JobSubmission):
    """Submit a job to the worker queue."""
    # Validate job_type exists in JobType
    try:
        JobType[job.job_type]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid job_type: {job.job_type}")
    
    # Validate payload is a dict
    if not isinstance(job.payload, dict):
        raise HTTPException(status_code=400, detail="payload must be a dictionary")
    
    # Submit job
    job_id = submit_job(job.job_type, job.payload)
    
    return {"status": "queued", "job_id": job_id}