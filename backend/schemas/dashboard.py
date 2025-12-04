"""Dashboard schema placeholders."""
from pydantic import BaseModel


class DashboardSnapshot(BaseModel):
    """TODO: capture dashboard tile payload."""
    summary: dict[str, str] | None = None
