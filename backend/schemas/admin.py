"""Admin schema placeholders."""
from pydantic import BaseModel


class SystemHealth(BaseModel):
    """TODO: describe system health response."""
    status: str | None = None
