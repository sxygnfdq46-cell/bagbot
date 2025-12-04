"""Shared schema components."""
from pydantic import BaseModel


class Pagination(BaseModel):
    """TODO: shared pagination block."""
    cursor: str | None = None
    limit: int | None = None
