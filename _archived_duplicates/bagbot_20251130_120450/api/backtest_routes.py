"""Backtest API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import os

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


class BacktestRequest(BaseModel):
    """Request model for running a backtest."""
    data_file: str = Field(..., description="Path to CSV data file")
    genome_file: Optional[str] = Field(None, description="Path to genome JSON file")
    initial_balance: float = Field(10000.0, description="Initial account balance")
    fee_rate: float = Field(0.001, description="Trading fee rate")


class BacktestResponse(BaseModel):
    """Response model for backtest submission."""
    job_id: str
    status: str


class BacktestResults(BaseModel):
    """Response model for backtest results."""
    job_id: str
    status: str
    results: Optional[Dict[str, Any]] = None


# In-memory storage for demo (replace with proper storage in production)
_backtest_jobs: Dict[str, Dict[str, Any]] = {}


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """
    Submit a backtest job.
    
    This endpoint queues a backtest job that will:
    1. Load historical candle data from the specified CSV
    2. Apply the genome configuration (if provided)
    3. Run the backtest using BacktestExecutor
    4. Generate performance metrics and reports
    
    Args:
        request: Backtest configuration
        
    Returns:
        Job ID and status
    """
    from backend.queue_bridge import submit_job
    import uuid
    
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
    
    # Validate genome file if provided
    if request.genome_file:
        genome_path = Path(request.genome_file)
        if not genome_path.exists() and not genome_path.is_absolute():
            genome_path = Path(__file__).parent.parent / request.genome_file
        
        if not genome_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Genome file not found: {request.genome_file}"
            )
    
    # Create payload for brain
    payload = {
        "data_file": str(data_path),
        "genome_file": request.genome_file,
        "initial_balance": request.initial_balance,
        "fee_rate": request.fee_rate
    }
    
    # Submit job via queue bridge
    job_id = f"backtest_{uuid.uuid4().hex[:8]}"
    
    # Store job info
    _backtest_jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "request": payload,
        "results": None
    }
    
    # Note: Actual job submission to worker queue would happen here
    # For now, we're storing it for the frontend to poll
    
    return BacktestResponse(
        job_id=job_id,
        status="queued"
    )


@router.get("/results/{job_id}", response_model=BacktestResults)
async def get_backtest_results(job_id: str):
    """
    Get results for a completed backtest job.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        Backtest results including metrics and trade history
    """
    if job_id not in _backtest_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Backtest job not found: {job_id}"
        )
    
    job = _backtest_jobs[job_id]
    
    return BacktestResults(
        job_id=job_id,
        status=job["status"],
        results=job.get("results")
    )


@router.get("/status/{job_id}")
async def get_backtest_status(job_id: str):
    """
    Get status of a backtest job.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        Current job status
    """
    if job_id not in _backtest_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Backtest job not found: {job_id}"
        )
    
    job = _backtest_jobs[job_id]
    
    return {
        "job_id": job_id,
        "status": job["status"]
    }
