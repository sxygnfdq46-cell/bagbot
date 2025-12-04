"""Charts schema placeholders."""
from pydantic import BaseModel


class Candle(BaseModel):
    """TODO: define OHLCV candle representation."""
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: float | None = None
