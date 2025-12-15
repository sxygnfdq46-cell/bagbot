"""Auth service responsible for validating credentials and issuing tokens."""
import os
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
        self._seed_observer_user()

    def _seed_admin_user(self) -> None:
        """Create the temporary admin user defined in the blueprint."""

        admin_email = os.environ.get("BAGBOT_ADMIN_EMAIL", "admin@bagbot.ai")
        admin_password = os.environ.get("BAGBOT_ADMIN_PASSWORD", "bagbot-admin")
        self._users[admin_email] = {
            "id": "admin-1",
            "name": "Control Admin",
            "email": admin_email,
            "role": "admin",
            "password_hash": hash_password(admin_password),
        }

    def _seed_observer_user(self) -> None:
        """Provide an observation-only user when observation mode is enabled."""

        observation_mode = os.environ.get("BAGBOT_OBSERVATION_MODE", "0") == "1"
        if not observation_mode:
            return

        observer_email = os.environ.get("BAGBOT_OBSERVER_EMAIL", "observer@bagbot.ai")
        observer_password = os.environ.get("BAGBOT_OBSERVER_PASSWORD", "observer-pass")

        self._users.setdefault(
            observer_email,
            {
                "id": "observer-1",
                "name": "Observer",
                "email": observer_email,
                "role": "observer",
                "password_hash": hash_password(observer_password),
            },
        )

    async def login(self, payload: LoginRequest) -> LoginResponse:
        """Validate credentials and return a JWT + profile."""

        normalized_email = payload.email.lower()
        record = self._users.get(normalized_email)

        observation_mode = os.environ.get("BAGBOT_OBSERVATION_MODE", "0") == "1"
        if record is None and observation_mode:
            # Allow observation-only bootstrap credentials without enabling admin powers
            observer_record = {
                "id": f"observer-{normalized_email}",
                "name": payload.email.split("@")[0] or "Observer",
                "email": normalized_email,
                "role": "observer",
                "password_hash": hash_password(payload.password or "observer-pass"),
            }
            self._users[normalized_email] = observer_record
            record = observer_record

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
