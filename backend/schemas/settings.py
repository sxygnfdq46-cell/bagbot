"""Settings schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class Preferences(BaseModel):
    """TODO: represent user settings."""
    theme: Optional[str] = None
