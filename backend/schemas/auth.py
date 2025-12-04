"""Auth schema placeholders."""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """TODO: define login payload."""
    username: str | None = None
    password: str | None = None
