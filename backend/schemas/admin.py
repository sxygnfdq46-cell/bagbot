"""Admin schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class SystemHealth(BaseModel):
    """TODO: describe system health response."""
    status: Optional[str] = None
