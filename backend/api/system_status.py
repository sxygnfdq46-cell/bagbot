"""System status endpoint for frontend."""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["system"])

@router.get("/system/status")
async def system_status():
    """Get system status."""
    return {"status": "online"}
