"""Brain schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class BrainMetric(BaseModel):
    """TODO: capture neural engine metrics."""

    name: Optional[str] = None
    value: Optional[float] = None
