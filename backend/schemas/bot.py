"""Bot schema placeholders."""
from pydantic import BaseModel


class BotState(BaseModel):
    """TODO: express bot runtime state."""
    status: str | None = None
