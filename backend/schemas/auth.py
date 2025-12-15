"""Authentication schemas aligned with the frontend contract."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Incoming login payload."""

    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """Shape of the authenticated user object returned to the UI."""

    id: str
    name: str
    email: EmailStr
    role: str


class LoginResponse(BaseModel):
    """Login response returned to the frontend."""

    token: str
    user: UserProfile


class ForgotPasswordRequest(BaseModel):
    """Minimal payload for password reset request."""

    email: EmailStr
