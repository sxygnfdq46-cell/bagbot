"""Artifacts API routes for genomes and reports."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Dict, Any
from pathlib import Path
import json
import os
from datetime import datetime

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])


def get_artifacts_dir() -> Path:
    """Get the artifacts directory path."""
    # Try multiple possible locations
    possible_paths = [
        Path(__file__).parent.parent.parent / "artifacts",  # bagbot/artifacts
        Path(__file__).parent.parent / "artifacts",  # bagbot/bagbot/artifacts
        Path.cwd() / "artifacts",  # Current directory
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    # Return the first one (even if it doesn't exist) as default
    return possible_paths[0]


@router.get("/genomes")
async def list_genomes():
    """
    List all genome artifacts.
    
    Returns:
        List of genome files with metadata
    """
    artifacts_dir = get_artifacts_dir()
    genomes_dir = artifacts_dir / "genomes"
    
    if not genomes_dir.exists():
        return {"genomes": [], "total": 0}
    
    genomes = []
    
    for file in genomes_dir.glob("*.json"):
        try:
            # Read genome file to extract metadata
            with open(file, 'r') as f:
                genome_data = json.load(f)
            
            # Extract timestamp from filename if present
            filename = file.name
            timestamp = None
            if "_" in filename:
                # Try to parse timestamp from filename like best_genome_dual_20251123_172808.json
                parts = filename.replace(".json", "").split("_")
                if len(parts) >= 3:
                    try:
                        date_str = parts[-2]
                        time_str = parts[-1]
                        timestamp = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}T{time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}Z"
                    except:
                        pass
            
            if not timestamp:
                # Use file modification time
                mtime = file.stat().st_mtime
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"
            
            # Extract fitness if available
            fitness = genome_data.get("fitness")
            objective = genome_data.get("objective", "unknown")
            
            genomes.append({
                "filename": filename,
                "timestamp": timestamp,
                "fitness": fitness,
                "objective": objective,
                "size": file.stat().st_size
            })
        except Exception as e:
            # Skip files that can't be read
            continue
    
    # Sort by timestamp (newest first)
    genomes.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"genomes": genomes, "total": len(genomes)}


@router.get("/reports")
async def list_reports():
    """
    List all report artifacts.
    
    Returns:
        List of report files with metadata
    """
    artifacts_dir = get_artifacts_dir()
    reports_dir = artifacts_dir / "reports"
    
    if not reports_dir.exists():
        return {"reports": [], "total": 0}
    
    reports = []
    
    for file in reports_dir.glob("*.txt"):
        try:
            # Extract timestamp from filename
            filename = file.name
            timestamp = None
            
            if "_" in filename:
                parts = filename.replace(".txt", "").split("_")
                if len(parts) >= 3:
                    try:
                        date_str = parts[-2]
                        time_str = parts[-1]
                        timestamp = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}T{time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}Z"
                    except:
                        pass
            
            if not timestamp:
                mtime = file.stat().st_mtime
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"
            
            # Try to extract metrics from report content
            metrics = {}
            try:
                with open(file, 'r') as f:
                    content = f.read()
                    # Simple parsing for key metrics
                    if "Sharpe Ratio:" in content:
                        for line in content.split('\n'):
                            if "Sharpe Ratio:" in line:
                                try:
                                    metrics["sharpe"] = float(line.split(":")[-1].strip())
                                except:
                                    pass
                            if "Total Return:" in line:
                                try:
                                    metrics["return"] = float(line.split(":")[-1].strip().replace("%", ""))
                                except:
                                    pass
            except:
                pass
            
            reports.append({
                "filename": filename,
                "timestamp": timestamp,
                "metrics": metrics,
                "size": file.stat().st_size
            })
        except Exception as e:
            continue
    
    # Sort by timestamp (newest first)
    reports.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"reports": reports, "total": len(reports)}


@router.get("/genomes/{filename}")
async def get_genome(filename: str):
    """
    Download a specific genome file.
    
    Args:
        filename: Name of the genome file
        
    Returns:
        JSON genome file
    """
    artifacts_dir = get_artifacts_dir()
    file_path = artifacts_dir / "genomes" / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Genome file not found: {filename}"
        )
    
    # Return as JSON response
    try:
        with open(file_path, 'r') as f:
            genome_data = json.load(f)
        return JSONResponse(content=genome_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading genome file: {str(e)}"
        )


@router.get("/reports/{filename}")
async def get_report(filename: str):
    """
    Download a specific report file.
    
    Args:
        filename: Name of the report file
        
    Returns:
        Text report file
    """
    artifacts_dir = get_artifacts_dir()
    file_path = artifacts_dir / "reports" / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Report file not found: {filename}"
        )
    
    return FileResponse(
        path=file_path,
        media_type="text/plain",
        filename=filename
    )


@router.get("/latest/genome")
async def get_latest_genome():
    """
    Get the most recent genome artifact.
    
    Returns:
        Latest genome JSON
    """
    artifacts_dir = get_artifacts_dir()
    genomes_dir = artifacts_dir / "genomes"
    
    if not genomes_dir.exists():
        raise HTTPException(
            status_code=404,
            detail="No genomes directory found"
        )
    
    # Get all genome files
    genome_files = list(genomes_dir.glob("*.json"))
    
    if not genome_files:
        raise HTTPException(
            status_code=404,
            detail="No genome files found"
        )
    
    # Sort by modification time (newest first)
    genome_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    latest_file = genome_files[0]
    
    try:
        with open(latest_file, 'r') as f:
            genome_data = json.load(f)
        return JSONResponse(content={
            "filename": latest_file.name,
            "data": genome_data
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading genome file: {str(e)}"
        )


@router.get("/latest/report")
async def get_latest_report():
    """
    Get the most recent report artifact.
    
    Returns:
        Latest report text
    """
    artifacts_dir = get_artifacts_dir()
    reports_dir = artifacts_dir / "reports"
    
    if not reports_dir.exists():
        raise HTTPException(
            status_code=404,
            detail="No reports directory found"
        )
    
    # Get all report files
    report_files = list(reports_dir.glob("*.txt"))
    
    if not report_files:
        raise HTTPException(
            status_code=404,
            detail="No report files found"
        )
    
    # Sort by modification time (newest first)
    report_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    latest_file = report_files[0]
    
    return FileResponse(
        path=latest_file,
        media_type="text/plain",
        filename=latest_file.name
    )
