"""Auth service responsible for validating credentials and issuing tokens."""
from typing import Dict

from fastapi import HTTPException, status

from backend.schemas.auth import LoginRequest, LoginResponse, UserProfile
from backend.security.jwt import create_access_token
from backend.security.passwords import hash_password, verify_password


class AuthService:
    """Handles email/password authentication using an in-memory user store."""

    def __init__(self) -> None:
        self._users: Dict[str, Dict[str, str]] = {}
        self._seed_admin_user()

    def _seed_admin_user(self) -> None:
        """Create the temporary admin user defined in the blueprint."""

        admin_email = "admin@bagbot.ai"
        self._users[admin_email] = {
            "id": "admin-1",
            "name": "Control Admin",
            "email": admin_email,
            "role": "admin",
            "password_hash": hash_password("bagbot-admin"),
        }

    async def login(self, payload: LoginRequest) -> LoginResponse:
        """Validate credentials and return a JWT + profile."""

        normalized_email = payload.email.lower()
        record = self._users.get(normalized_email)
        if record is None or not verify_password(payload.password, record["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        profile = UserProfile(
            id=record["id"],
            name=record["name"],
            email=record["email"],
            role=record["role"],
        )
        token = create_access_token(profile.model_dump())
        return LoginResponse(token=token, user=profile)

    async def logout(self) -> dict[str, bool]:
        """Stateless logout placeholder."""

        return {"success": True}
