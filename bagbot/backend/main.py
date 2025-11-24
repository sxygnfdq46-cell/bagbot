from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from api.routes import router as api_router
from api.backtest_routes import router as backtest_router
from api.optimizer_routes import router as optimizer_router
from api.artifacts_routes import router as artifacts_router
from api.strategy_routes import router as strategy_router
from api.logs_routes import router as logs_router
from backend.queue_bridge import submit_job
from worker.tasks import JobType

# Load configuration
try:
    from backend.config import Config
    config = Config
except ImportError:
    # Fallback if config not available
    class Config:
        ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
        DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Configure logging (never log secrets)
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Disable debug mode in production
app = FastAPI(
    title="Bagbot Backend",
    description="Institutional-grade trading bot backend API",
    version="2.0.0",
    docs_url="/docs" if config.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if config.DEBUG else None,
    debug=config.DEBUG
)

# Configure CORS with environment-based origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(api_router)
app.include_router(backtest_router)
app.include_router(optimizer_router)
app.include_router(artifacts_router)
app.include_router(strategy_router)
app.include_router(logs_router)


class JobSubmission(BaseModel):
    job_type: str
    payload: dict


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "bagbot backend"}


@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "ok": True,
        "status": "healthy",
        "service": "bagbot-backend",
        "version": "2.0.0"
    }


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