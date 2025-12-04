"""Schemas for the admin control surface."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class SystemHealth(BaseModel):
    """Health snapshot mirrored from the frontend contract."""

    uptime: str
    cpuLoad: float
    ramUsage: float
    backendStatus: str
    brainStatus: str


class AdminLogEntry(BaseModel):
    """Single entry in the rolling admin log buffer."""

    id: str
    type: Literal["info", "warning", "error"]
    message: str
    timestamp: datetime


class AdminActionResponse(BaseModel):
    """Generic response for admin control mutations."""

    success: bool
    mode: Optional[str] = None
    message: Optional[str] = None
