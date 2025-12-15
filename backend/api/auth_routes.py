"""Auth routes implementing email/password login per blueprint."""
from fastapi import APIRouter, Depends

from backend.schemas.auth import ForgotPasswordRequest, LoginRequest, LoginResponse
from backend.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])

_auth_service = AuthService()


def get_auth_service() -> AuthService:
    """Return the singleton auth service instance."""

    return _auth_service


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)) -> LoginResponse:
    """Validate credentials and return a JWT + user profile."""

    return await service.login(payload)


@router.post("/logout")
async def logout(service: AuthService = Depends(get_auth_service)) -> dict[str, bool]:
    """Stateless logout; frontend will discard its token."""

    return await service.logout()


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)) -> dict[str, bool]:
    """Stubbed forgot-password handler (non-mutating)."""

    # In observation mode we do not send emails; simply acknowledge receipt.
    return {"ok": True}
