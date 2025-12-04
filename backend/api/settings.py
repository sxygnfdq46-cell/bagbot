"""Settings endpoints for the settings page."""
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/preferences")
async def get_preferences() -> dict[str, Any]:
    """Return user preferences (placeholder)."""
    return {"detail": "preferences placeholder"}


@router.post("/preferences")
async def save_preferences() -> dict[str, Any]:
    """Persist user preferences (placeholder)."""
    return {"detail": "save preferences placeholder"}


@router.post("/api-keys")
async def save_api_keys() -> dict[str, Any]:
    """Store API keys (placeholder)."""
    return {"detail": "save api keys placeholder"}


@router.get("/api-keys")
async def get_api_keys() -> dict[str, Any]:
    """Return stored API keys (placeholder)."""
    return {"detail": "get api keys placeholder"}
