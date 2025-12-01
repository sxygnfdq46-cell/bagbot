"""Trading endpoints for frontend."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/trading", tags=["trading"])

@router.get("/recent")
async def get_recent(limit: int = 10):
    """Get recent trades."""
    return []

@router.get("/positions")
async def get_positions():
    """Get current positions."""
    return []
