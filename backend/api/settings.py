"""Settings endpoints for preferences and API keys."""
from fastapi import APIRouter, Depends, HTTPException, status

from backend.schemas.settings import ApiKeyIn, ApiKeyOut, PreferencesIn, PreferencesOut
from backend.schemas.auth import UserProfile
from backend.security.deps import get_current_user
from backend.services.settings_service import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/preferences", response_model=PreferencesOut)
async def get_preferences(current_user: UserProfile = Depends(get_current_user)) -> PreferencesOut:
    """Return the current user's preferences."""

    return settings_service.get_preferences(current_user.id)


@router.post("/preferences", response_model=PreferencesOut)
async def save_preferences(
    body: PreferencesIn,
    current_user: UserProfile = Depends(get_current_user),
) -> PreferencesOut:
    """Persist user preferences and return the saved record."""

    return settings_service.save_preferences(current_user.id, body.model_dump(exclude_none=True))


@router.post("/api-keys", response_model=ApiKeyOut, status_code=status.HTTP_201_CREATED)
async def add_api_key(
    body: ApiKeyIn,
    current_user: UserProfile = Depends(get_current_user),
) -> ApiKeyOut:
    """Store an API key encrypted at rest, returning a redacted view."""

    return settings_service.add_api_key(current_user.id, body.name, body.key.get_secret_value())


@router.get("/api-keys", response_model=list[ApiKeyOut])
async def list_api_keys(current_user: UserProfile = Depends(get_current_user)) -> list[ApiKeyOut]:
    """Return redacted API keys for the current user."""

    return settings_service.list_api_keys(current_user.id)
