"""Charts schema placeholders."""
from typing import Optional

from pydantic import BaseModel


class Candle(BaseModel):
    """TODO: define OHLCV candle representation."""
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
