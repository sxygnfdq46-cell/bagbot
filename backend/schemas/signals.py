"""Signals schema placeholders."""
from pydantic import BaseModel


class SignalRecord(BaseModel):
    """TODO: describe signal payload."""
    provider: str | None = None
    payload: dict[str, str] | None = None
