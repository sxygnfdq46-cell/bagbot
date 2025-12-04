"""Bot schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class BotState(BaseModel):
    """TODO: express bot runtime state."""
    status: Optional[str] = None
