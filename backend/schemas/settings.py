"""Settings schema placeholders."""
from pydantic import BaseModel


class Preferences(BaseModel):
    """TODO: represent user settings."""
    theme: str | None = None
