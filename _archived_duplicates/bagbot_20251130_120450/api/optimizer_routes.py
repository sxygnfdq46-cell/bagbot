"""Optimizer API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from pathlib import Path
import uuid

router = APIRouter(prefix="/api/optimizer", tags=["optimizer"])


class OptimizerRequest(BaseModel):
    """Request model for running optimizer."""
    data_file: str = Field(..., description="Path to CSV data file")
    objective: str = Field("sharpe", description="Optimization objective: sharpe, total_return, or dual")
    population: int = Field(24, description="Population size", ge=4, le=100)
    generations: int = Field(30, description="Number of generations", ge=1, le=100)
    seed: Optional[int] = Field(42, description="Random seed for reproducibility")


class OptimizerResponse(BaseModel):
    """Response model for optimizer submission."""
    job_id: str
    status: str


class OptimizerStatus(BaseModel):
    """Response model for optimizer status."""
    job_id: str
    status: str
    progress: Optional[Dict[str, Any]] = None


class OptimizerResults(BaseModel):
    """Response model for optimizer results."""
    job_id: str
    status: str
    best_genome: Optional[Dict[str, Any]] = None
    best_fitness: Optional[float] = None
    artifact_path: Optional[str] = None


# In-memory storage for demo
_optimizer_jobs: Dict[str, Dict[str, Any]] = {}


@router.post("/run", response_model=OptimizerResponse)
async def run_optimizer(request: OptimizerRequest):
    """
    Submit an optimization job.
    
    This endpoint queues a genetic optimization job that will:
    1. Load historical candle data
    2. Run genetic algorithm with specified parameters
    3. Find optimal strategy parameters
    4. Save best genome to artifacts
    5. Generate performance report
    
    Args:
        request: Optimizer configuration
        
    Returns:
        Job ID and status
    """
    # Validate data file exists
    data_path = Path(request.data_file)
    if not data_path.exists() and not data_path.is_absolute():
        # Try relative to bagbot directory
        data_path = Path(__file__).parent.parent / request.data_file
    
    if not data_path.exists():
        raise HTTPException(
            status_code=400,
            detail=f"Data file not found: {request.data_file}"
        )
    
    # Validate objective
    valid_objectives = ["sharpe", "total_return", "dual"]
    if request.objective not in valid_objectives:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid objective. Must be one of: {', '.join(valid_objectives)}"
        )
    
    # Create job ID
    job_id = f"opt_{uuid.uuid4().hex[:8]}"
    
    # Create payload
    payload = {
        "data_file": str(data_path),
        "objective": request.objective,
        "population": request.population,
        "generations": request.generations,
        "seed": request.seed
    }
    
    # Store job info
    _optimizer_jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "request": payload,
        "progress": {
            "current_generation": 0,
            "total_generations": request.generations,
            "best_fitness": None
        },
        "results": None
    }
    
    return OptimizerResponse(
        job_id=job_id,
        status="queued"
    )


@router.get("/status/{job_id}", response_model=OptimizerStatus)
async def get_optimizer_status(job_id: str):
    """
    Get status and progress of an optimization job.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        Current status and progress information
    """
    if job_id not in _optimizer_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Optimizer job not found: {job_id}"
        )
    
    job = _optimizer_jobs[job_id]
    
    return OptimizerStatus(
        job_id=job_id,
        status=job["status"],
        progress=job.get("progress")
    )


@router.get("/results/{job_id}", response_model=OptimizerResults)
async def get_optimizer_results(job_id: str):
    """
    Get results for a completed optimization job.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        Best genome, fitness score, and artifact paths
    """
    if job_id not in _optimizer_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Optimizer job not found: {job_id}"
        )
    
    job = _optimizer_jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Optimization not yet completed. Current status: {job['status']}"
        )
    
    results = job.get("results", {})
    
    return OptimizerResults(
        job_id=job_id,
        status=job["status"],
        best_genome=results.get("best_genome"),
        best_fitness=results.get("best_fitness"),
        artifact_path=results.get("artifact_path")
    )


@router.get("/history")
async def get_optimizer_history():
    """
    Get list of all optimization jobs.
    
    Returns:
        List of optimizer jobs with metadata
    """
    jobs = []
    for job_id, job_data in _optimizer_jobs.items():
        jobs.append({
            "job_id": job_id,
            "status": job_data["status"],
            "objective": job_data["request"].get("objective"),
            "generations": job_data["request"].get("generations"),
            "best_fitness": job_data.get("progress", {}).get("best_fitness")
        })
    
    return {"jobs": jobs, "total": len(jobs)}
