"""Brain schema placeholders."""
from pydantic import BaseModel


class BrainMetric(BaseModel):
    """TODO: capture neural engine metrics."""
    name: str | None = None
    value: float | None = None
