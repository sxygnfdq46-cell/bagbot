"""Auth schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """TODO: define login payload."""

    username: Optional[str] = None
    password: Optional[str] = None
