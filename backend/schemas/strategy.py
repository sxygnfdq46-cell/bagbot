"""Strategy schema placeholders."""
from typing import Dict, Optional

from pydantic import BaseModel


class StrategyConfig(BaseModel):
    """TODO: represent strategy configuration."""

    strategy_id: Optional[str] = None
    params: Optional[Dict[str, str]] = None
