"""Basic health endpoints."""
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/ping")
async def ping() -> dict[str, Any]:
    """Simple liveness check (placeholder)."""
    return {"detail": "pong"}
