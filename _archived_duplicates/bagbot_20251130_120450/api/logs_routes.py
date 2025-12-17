"""Logs API routes."""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
import logging
import json
import asyncio

router = APIRouter(prefix="/api/logs", tags=["logs"])


class LogEntry:
    """Model for a log entry."""
    def __init__(self, timestamp: str, level: str, message: str, source: str = "", job_id: str = ""):
        self.timestamp = timestamp
        self.level = level
        self.message = message
        self.source = source
        self.job_id = job_id
    
    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "level": self.level,
            "message": self.message,
            "source": self.source,
            "job_id": self.job_id
        }


# In-memory log storage (for demo - replace with proper log aggregation)
_log_buffer: List[LogEntry] = []


def get_log_file_path() -> Optional[Path]:
    """Get the path to the log file if it exists."""
    possible_paths = [
        Path.cwd() / "bagbot.log",
        Path(__file__).parent.parent / "bagbot.log",
        Path.home() / ".bagbot" / "bagbot.log",
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    return None


@router.get("")
async def get_logs(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARNING, ERROR, DEBUG)"),
    since: Optional[str] = Query(None, description="Get logs since this timestamp (ISO format)"),
    source: Optional[str] = Query(None, description="Filter by source file/module")
):
    """
    Get recent log entries.
    
    Args:
        limit: Maximum number of logs to return
        level: Filter by log level
        since: Get logs since this timestamp
        source: Filter by source
        
    Returns:
        List of log entries
    """
    # Try to read from log file if it exists
    log_file = get_log_file_path()
    logs = []
    
    if log_file and log_file.exists():
        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()
                
                # Parse last N lines
                for line in lines[-limit:]:
                    try:
                        # Simple log parsing (adjust based on your log format)
                        # Expected format: "2025-11-23 17:28:08 - INFO - message"
                        parts = line.strip().split(" - ", 2)
                        if len(parts) >= 3:
                            timestamp = parts[0]
                            log_level = parts[1]
                            message = parts[2]
                            
                            # Apply filters
                            if level and log_level != level:
                                continue
                            
                            if since:
                                try:
                                    log_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                                    since_time = datetime.fromisoformat(since.replace("Z", "+00:00"))
                                    if log_time < since_time:
                                        continue
                                except:
                                    pass
                            
                            logs.append({
                                "timestamp": timestamp,
                                "level": log_level,
                                "message": message,
                                "source": "",
                                "job_id": ""
                            })
                    except Exception as e:
                        continue
        except Exception as e:
            logging.error(f"Error reading log file: {e}")
    
    # If no logs from file, return sample logs
    if not logs:
        logs = [
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": "INFO",
                "message": "Backend API initialized",
                "source": "backend.main",
                "job_id": ""
            },
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": "INFO",
                "message": "Worker ready for jobs",
                "source": "worker.engine",
                "job_id": ""
            }
        ]
    
    return {
        "logs": logs[:limit],
        "total": len(logs),
        "has_more": len(logs) > limit
    }


@router.get("/stream")
async def stream_logs():
    """
    Stream logs in real-time (Server-Sent Events).
    
    Returns:
        SSE stream of log entries
    """
    async def log_generator():
        """Generate log events."""
        # This is a placeholder - implement actual log streaming
        while True:
            # In production, this would read from a log stream
            yield f"data: {json.dumps({'message': 'Log streaming not yet implemented'})}\n\n"
            await asyncio.sleep(1)
    
    return StreamingResponse(
        log_generator(),
        media_type="text/event-stream"
    )


@router.get("/download")
async def download_logs():
    """
    Download the complete log file.
    
    Returns:
        Log file for download
    """
    log_file = get_log_file_path()
    
    if not log_file or not log_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Log file not found"
        )
    
    return FileResponse(
        path=log_file,
        media_type="text/plain",
        filename=f"bagbot_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.log"
    )


@router.get("/levels")
async def get_log_levels():
    """
    Get available log levels and their counts.
    
    Returns:
        Log level statistics
    """
    return {
        "levels": [
            {"name": "DEBUG", "count": 0},
            {"name": "INFO", "count": 0},
            {"name": "WARNING", "count": 0},
            {"name": "ERROR", "count": 0},
            {"name": "CRITICAL", "count": 0}
        ]
    }


@router.get("/search")
async def search_logs(
    query: str = Query(..., description="Search query"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results")
):
    """
    Search logs by keyword.
    
    Args:
        query: Search term
        limit: Maximum results
        
    Returns:
        Matching log entries
    """
    log_file = get_log_file_path()
    results = []
    
    if log_file and log_file.exists():
        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()
                
                for line in lines:
                    if query.lower() in line.lower():
                        try:
                            parts = line.strip().split(" - ", 2)
                            if len(parts) >= 3:
                                results.append({
                                    "timestamp": parts[0],
                                    "level": parts[1],
                                    "message": parts[2],
                                    "source": "",
                                    "job_id": ""
                                })
                                
                                if len(results) >= limit:
                                    break
                        except:
                            continue
        except Exception as e:
            logging.error(f"Error searching logs: {e}")
    
    return {
        "query": query,
        "results": results,
        "total": len(results)
    }


@router.delete("/clear")
async def clear_logs():
    """
    Clear all log entries (use with caution).
    
    Returns:
        Confirmation of log clearing
    """
    # This is a dangerous operation - should require authentication
    return {
        "status": "not_implemented",
        "message": "Log clearing requires admin authentication"
    }
